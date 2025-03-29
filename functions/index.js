const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();
const db = admin.firestore();
const rtdb = admin.database();

// User Profile Creation
exports.createUserProfile = functions.auth.user().onCreate(async (user) => {
  try {
    const userRef = db.doc(`users/${user.uid}`);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      await userRef.set({
        uid: user.uid,
        displayName: user.displayName || "",
        email: user.email || "",
        emailVerified: user.emailVerified,
        phoneNumber: user.phoneNumber || "",
        photoURL: user.photoURL || "",
      });
      functions.logger.info(`User profile created: ${user.uid}`);
    }
  } catch (error) {
    functions.logger.error(`User creation failed: ${error.message}`);
    throw error;
  }
});

// Chat Room Creation Handler (Realtime Database)
exports.onCreateChatRoom = functions.database
  .ref("/chat_rooms/{chatId}")
  .onCreate(async (snapshot, context) => {
    try {
      const { chatId } = context.params;
      const { uid1, uid2 } = snapshot.val();

      // Update both users' chat lists
      const updates = {
        [`user_chatIds/${uid1}/${chatId}`]: true,
        [`user_chatIds/${uid2}/${chatId}`]: true,
      };

      await rtdb.ref().update(updates);
      functions.logger.info(`Chat ${chatId} added to user profiles`);
    } catch (error) {
      functions.logger.error(`Chat room creation failed: ${error.message}`);
      throw error;
    }
  });

// Updated Message Handling
exports.addMessageToChat = functions.https.onRequest(async (req, res) => {
  try {
    const { chatId, sender, message } = req.body;

    if (!chatId || !sender || !message) {
      res.status(400).send("Missing required fields");
      return;
    }

    const messagesRef = rtdb.ref(`messages/${chatId}`);
    const newMessageRef = messagesRef.push();
    await newMessageRef.set({
      sender,
      message,
      // timestamp: admin.database.ServerValue.TIMESTAMP,
    });

    res.status(200).json({
      success: true,
      messageId: newMessageRef.key,
      chatId: chatId,
    });
  } catch (error) {
    functions.logger.error("Failed to add message:", error);
    res.status(500).send(error.message);
  }
});
