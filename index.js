const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const connectDB = require('./config/db');
const { db, checkConnection } = require('./config/sqlDb')
const Message = require('./models/Message');
const ChatUser = require('./models/ChatUser');
const Chat = require('./models/Chat');
let chatId = "";
require('dotenv').config();
const AWS = require('aws-sdk');
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

checkConnection()

const app = express();
const server = http.createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const hostname = '0.0.0.0';
const port = process.env.PORT || 3005;

// Middleware to parse JSON bodies
app.use(express.json());

app.use(cors()); // Enable CORS for all routes

// Connect to the database
connectDB().catch(err => {
  console.error('Failed to connect to the database:', err);
  process.exit(1); // Exit the process if the connection fails
});

// Function to upload image to S3
const uploadImageToS3 = (imageBuffer, imageName) => {
  // Get the current date
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Months are 0-based
  const day = String(currentDate.getDate()).padStart(2, '0');

  // Construct the file path
  const filePath = `${year}/${month}/${day}/${imageName}`;

  // Set the parameters for S3 upload
  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: filePath,
    Body: imageBuffer,
    ContentType: 'image/jpeg', // or the appropriate MIME type
    ACL: 'public-read' // adjust the ACL as needed
  };

  // Upload the image
  return s3.upload(params).promise();
};

io.on("connection", (socket) => {
  socket.on("Sendmessage", async (msg) => {
    console.log("Calling Send Message");
    const { message, sourceId, targetId } = msg;
    console.log({ message, sourceId, targetId, chatId });

    const newMessage = new Message({ message, sourceId, chatId });
    await newMessage.save();
    console.log("Saved");

    // Emit the message to all connected clients in the chat
    io.to(chatId.toString()).emit("OneByOnemessage", newMessage);
    console.log("Message emitted to chatId:", chatId);
  });

  socket.on("leaveChat", ({ sourceId }) => {
    console.log("Leave Chat:", sourceId);
    delete clients[sourceId];
  });

  socket.on("joinChat", async ({ users }) => {
  
    try {
      let chat = await Chat.findOne({
        users: { $all: users, $size: users.length },
      });
 
      if (chat) {
        const messages = await Message.find({ chatId: chat._id });

        messages.forEach((message) => {;
          socket.emit("OneByOnemessage", message);
        });
        socket.join(chat._id.toString()); 
        return (chatId = chat._id);
      } else {
        chat = new Chat({ users });
        await chat.save();
        socket.join(chat._id.toString()); 
        return (chatId = chat._id);
      }
    } catch (error) {
      console.error("Error creating chat:", error);
    }
  });
});

// // Connect to the Socket server
// io.on("connection", (socket) => {
//   console.log("Connected to Socket.io");

//   // Remove the "signin" functionality and clients management
//   // socket.on("signin", (id) => {
//   //   console.log("Signed in");
//   //   clients[id] = socket;
//   //   // console.log(clients);
//   // });

//   socket.on("message", (msg) => {
//     console.log("Calling Send Message");
//     const message = msg.message;
//     const sourceId = msg.sourceId;
//     const targetId = msg.targetId;
//     console.log({ message, sourceId, chatId });
//     const newMessage = new Message({ message, sourceId, chatId });
//     newMessage.save();
//     socket.emit("message", msg);
//     console.log("Saved");
//   });

//   // // Sending messages to each other
//   // socket.on("message", async (msg) => {
//   //   console.log("Calling Send Message");
//   //   const { message, sourceId, targetId } = msg; // Assuming imageBuffer and imageName are part of the message object
//   //   console.log({ message, sourceId, targetId });


//   //   // if (isImage) {
//   //   // try {
//   //   //   // Upload image to S3
//   //   //   await uploadImageToS3(imageBuffer, imageName);

//   //   //   // Save message with image details to MongoDB
//   //   //   const newMessage = new MessageModel({ message: `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${imageName}`, sourceId, chatId, isImage });
//   //   //   await newMessage.save();
//   //   //   console.log("Image uploaded and message saved");

//   //   //   // Emit message to target client
//   //   //   socket.emit("message", msg);
//   //   // } catch (error) {
//   //   //   console.error("Error uploading image or saving message:", error);
//   //   // }
//   //   // } else {
//   //   // Save message to MongoDB
//   //   const newMessage = new MessageModel({ message, sourceId, chatId });
//   //   await newMessage.save();
//   //   console.log("Message saved");

//   //   // Emit message to target client
//   //   socket.emit("message", msg);
//   //   // }
//   // });

//   socket.on("deleteMessage", async (msgId) => {
//     try {
//       // Find the message in MongoDB
//       const message = await MessageModel.findById(msgId);

//       if (!message) {
//         console.log("Message not found");
//         return;
//       }

//       // If the message contains an image, delete it from S3
//       if (message.isImage) {
//         const imageUrl = message.message;
//         const imageName = imageUrl.split('/').pop(); // Get the image name from the URL

//         try {
//           await deleteImageFromS3(imageName);
//           console.log("Image deleted from S3");
//         } catch (error) {
//           console.error("Error deleting image from S3:", error);
//         }
//       }

//       // Delete the message from MongoDB
//       await MessageModel.findByIdAndDelete(msgId);
//       console.log("Message deleted from MongoDB");

//       // Emit a message to the client to confirm deletion
//       socket.emit("messageDeleted", { msgId });
//     } catch (error) {
//       console.error("Error deleting message:", error);
//     }
//   });

//   // Function to delete an image from S3
//   async function deleteImageFromS3(imageName) {
//     const params = {
//       Bucket: process.env.S3_BUCKET_NAME,
//       Key: imageName,
//     };

//     await s3.deleteObject(params).promise();
//   }

//   socket.on("leaveChat", ({ sourceId }) => {
//     console.log("Leave Chat:", sourceId);
//     // Removed clients object logic
//   });

//   socket.on("joinChat", async ({ users }) => {
//     console.log("Joined Chat", users);
//     console.log("Subject: ", subject, "isGroup: ", isGroup);
//     try {
//       let chat = "";
//       if(isGroup){
//         chat = await Chat.findOne({
//           subject: subject,
//           users: { $all: users, $size: users.length }
//         });
//       }else{
//         chat = await Chat.findOne({
//           users: { $all: users, $size: users.length }
//         });
//       }
//       if (chat) {
//         Message.find({ chatId: chat._id })
//           .then((messages) => {
//             console.log("Fetched messages:", messages);
//             messages.forEach((message) => {
//               socket.emit("message", message);
//             });
//           })
//           .catch((err) => console.error("Error fetching messages:", err));
//         return chatId = chat._id;

//       } else {
//         chat = new Chat({ users });
//         await chat.save();
//         return chatId = chat._id;

//       }
//     } catch (error) {
//       console.error("Error creating chat:", error);
//     }
//   });

//   // socket.on('getUsers', async (subject) => {
//   //   try {
//   //     // Fetch UIDs from user_courses based on the subject
//   //     const userCourses = await db('SELECT uid FROM user_courses WHERE course_id = ?', [subject]);

//   //     // Extract the UIDs from the result
//   //     const uids = userCourses.map((row) => row.uid);


//   //     // Check if there are any UIDs
//   //     if (uids.length === 0) {
//   //       socket.emit('getUsers', { mentors: [], students: [] });
//   //       return;
//   //     }

//   //     // Fetch users from dot_users based on the UIDs
//   //     const query = 'SELECT * FROM dot_users WHERE firebase_uid IN (?)';
//   //     const users = await db(query, [uids]);


//   //     // Categorize users
//   //     const mentors = users.filter((user) => user.user_type === 'mentor');
//   //     const students = users.filter((user) => user.user_type === 'student');

//   //     // Emit data via socket using the 'getUsers' event
//   //     socket.emit('getUsers', { mentors, students });

//   //   } catch (error) {
//   //     console.error('Error fetching or processing users:', error.message);
//   //     socket.emit('error', { message: 'Error fetching users' });
//   //   }

//   //   socket.on("refreshConnection", () => {
//   //     console.log("Refreshing connection");
//   //   });

//   // });

// });

// Import and use routes
const getUsersRoutes = require('./routes/getUsersRouter');
app.use('/', getUsersRoutes);


server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});

module.exports = { app, server, io };
