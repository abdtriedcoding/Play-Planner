import { useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc,
  getDocs,
  updateDoc,
  arrayRemove,
  arrayUnion,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/firebaseClient";
import { useAuth } from "@/context/authContext";
import { toast } from "sonner";

const CreatePostModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async () => {
    if (!imageFile) return null;
    try {
      const storageRef = ref(storage, `posts/${Date.now()}_${imageFile.name}`);
      await uploadBytes(storageRef, imageFile);
      return await getDownloadURL(storageRef);
    } catch (error) {
      toast.error("Image upload failed");
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && !imageFile) return;

    setIsUploading(true);
    try {
      const imageUrl = await handleImageUpload();

      await addDoc(collection(db, "posts"), {
        content: content.trim(),
        imageUrl,
        authorId: user.uid,
        likes: [],
        comments: 0,
        createdAt: serverTimestamp(),
      });

      setContent("");
      setImageFile(null);
      onClose();
      toast.success("Post created successfully!");
    } catch (error) {
      toast.error("Failed to create post");
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50 bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl w-full max-w-2xl p-6 space-y-4 shadow-lg">
        <div className="flex justify-between items-center border-b border-sky-100 pb-4">
          <h3 className="text-xl font-bold text-slate-800">
            Share Your Victory
          </h3>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share your match victory or upcoming match details!"
            className="w-full p-4 rounded-lg border border-sky-200 focus:ring-2 focus:ring-sky-500 h-32 resize-none"
          />

          <div className="flex items-center justify-between">
            <label className="cursor-pointer text-sky-600 hover:text-sky-700">
              <input
                type="file"
                onChange={(e) => setImageFile(e.target.files[0])}
                accept="image/*"
                className="hidden"
              />
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </label>

            <button
              type="submit"
              disabled={isUploading || (!content.trim() && !imageFile)}
              className={`px-6 py-2 rounded-full font-medium ${
                isUploading
                  ? "bg-sky-200"
                  : "bg-sky-600 hover:bg-sky-700 text-white"
              }`}
            >
              {isUploading ? "Posting Match Results..." : "Post Match Results"}
            </button>
          </div>

          {imageFile && (
            <div className="relative">
              <img
                src={URL.createObjectURL(imageFile)}
                alt="Preview"
                className="rounded-lg max-h-48 object-cover w-full"
              />
              <button
                type="button"
                onClick={() => setImageFile(null)}
                className="absolute top-2 right-2 bg-white p-1 rounded-full shadow-sm"
              >
                ✕
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

const Comment = ({ comment }) => {
  return (
    <div className="flex gap-3 items-start p-4 bg-sky-50 rounded-xl">
      <div className="flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center overflow-hidden">
          {comment.teamData?.avatar ? (
            <img
              src={comment.teamData.avatar}
              alt="Team avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-sky-600 text-sm">
              {comment.teamData?.name?.[0] || "T"}
            </span>
          )}
        </div>
      </div>
      <div className="flex-grow">
        <div className="flex items-baseline gap-2">
          <span className="font-medium text-slate-800 text-sm">
            {comment.teamData?.name || "Unnamed Team"}
          </span>
          <span className="text-xs text-slate-400">
            {new Date(comment.createdAt?.toDate()).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
        <p className="text-slate-700 text-sm mt-1">{comment.content}</p>
      </div>
    </div>
  );
};

const PostCard = ({ post }) => {
  const [teamData, setTeamData] = useState(null);
  const { user } = useAuth();
  const [isLiking, setIsLiking] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [isCommenting, setIsCommenting] = useState(false);

  useEffect(() => {
    if (!showComments) return;

    const commentsRef = collection(db, "posts", post.id, "comments");
    const q = query(commentsRef, orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setComments(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return unsubscribe;
  }, [post.id, showComments]);

  const handleLike = async () => {
    if (!user) {
      toast.info("Please login to like posts");
      return;
    }

    try {
      setIsLiking(true);
      const postRef = doc(db, "posts", post.id);

      await updateDoc(postRef, {
        likes: post.likes?.includes(user.uid)
          ? arrayRemove(user.uid)
          : arrayUnion(user.uid),
      });
    } catch (error) {
      toast.error("Couldn't update likes: " + error.message);
    } finally {
      setIsLiking(false);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !user) return;

    try {
      setIsCommenting(true);

      // Get user's team data
      const teamsRef = collection(db, "users", user.uid, "my_team");
      const teamSnap = await getDocs(teamsRef);
      const teamData = teamSnap.docs[0]?.data();

      const commentsRef = collection(db, "posts", post.id, "comments");
      const commentDocRef = await addDoc(commentsRef, {
        content: commentText.trim(),
        authorId: user.uid,
        teamData: {
          name: teamData?.name,
          avatar: teamData?.avatar,
          sports: teamData?.sports,
        },
        createdAt: serverTimestamp(),
      });

      // Now update the post's comment count
      const postRef = doc(db, "posts", post.id);
      await updateDoc(postRef, {
        commentsCount: post.commentsCount ? post.commentsCount + 1 : 1,
      });

      setCommentText(""); // Clear the input field
    } catch (error) {
      toast.error("Failed to post comment: " + error.message);
    } finally {
      setIsCommenting(false);
    }
  };

  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        // Get reference to the user's team subcollection
        const teamsRef = collection(db, "users", post.authorId, "my_team");
        const teamSnap = await getDocs(teamsRef);

        if (!teamSnap.empty) {
          // Get first team (assuming one team per user for simplicity)
          const teamDoc = teamSnap.docs[0];
          setTeamData(teamDoc.data());
        }
      } catch (error) {
        console.error("Error fetching team data:", error);
      }
    };

    fetchTeamData();
  }, [post.authorId]);

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-sky-100">
      <div className="flex gap-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-sky-100 flex items-center justify-center overflow-hidden">
            {teamData?.avatar ? (
              <img
                src={teamData.avatar}
                alt="Team avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-sky-600">🏐</span>
            )}
          </div>
        </div>

        <div className="flex-grow">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-slate-800">
              {teamData?.name || "Unnamed Team"}
            </h4>
            {teamData?.location?.city && (
              <span className="text-sm text-slate-500">
                • {teamData.location.city}
              </span>
            )}
          </div>

          <div className="mt-1 flex gap-2">
            {teamData?.sports?.map((sport) => (
              <span
                key={sport}
                className="px-2 py-1 bg-sky-100 text-sky-800 rounded-full text-xs"
              >
                {sport}
              </span>
            ))}
          </div>

          <p className="mt-2 text-slate-800">{post.content}</p>

          {post.imageUrl && (
            <img
              src={post.imageUrl}
              alt="Post content"
              className="mt-4 rounded-xl w-full max-h-96 object-cover"
            />
          )}

          <div className="flex gap-8 mt-4 text-slate-500">
            <button
              onClick={handleLike}
              disabled={isLiking}
              className={`flex items-center gap-2 ${
                post.likes?.includes(user?.uid)
                  ? "text-red-500 hover:text-red-600"
                  : "text-slate-500 hover:text-sky-600"
              }`}
            >
              <svg
                className="w-5 h-5"
                fill={post.likes?.includes(user?.uid) ? "currentColor" : "none"}
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
              {post.likes?.length || 0}
            </button>

            <button className="flex items-center gap-2 hover:text-sky-600">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              {post.commentsCount || 0}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowComments(!showComments)}
            className="text-slate-500 hover:text-sky-600 text-sm font-medium"
          >
            {comments.length === 1 ? "Comment" : "Comments"}
          </button>
          <div className="flex-1 border-t border-sky-100"></div>
        </div>

        {showComments && (
          <div className="space-y-4">
            <div className="max-h-64 overflow-y-auto space-y-3 pr-2">
              {comments.map((comment) => (
                <Comment key={comment.id} comment={comment} />
              ))}

              {comments.length === 0 && (
                <p className="text-center text-slate-400 py-4 text-sm">
                  No comments yet
                </p>
              )}
            </div>

            <form onSubmit={handleCommentSubmit} className="flex gap-3">
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 px-4 py-2 border border-sky-200 rounded-full text-sm focus:ring-2 focus:ring-sky-500"
                disabled={isCommenting}
              />
              <button
                type="submit"
                disabled={isCommenting || !commentText.trim()}
                className={`px-4 py-2 text-sm rounded-full ${
                  isCommenting
                    ? "bg-sky-100 text-slate-400"
                    : "bg-sky-600 text-white hover:bg-sky-700"
                }`}
              >
                {isCommenting ? "Posting..." : "Post"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

const FeedPage = () => {
  const [posts, setPosts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    return unsubscribe;
  }, []);

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <header className="flex justify-between items-center border-b border-sky-100 pb-4">
        <h1 className="text-2xl font-bold text-slate-800">Victory Feed</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-sky-600 text-white px-6 py-2 rounded-full hover:bg-sky-700"
        >
          Share Victory
        </button>
      </header>

      <div className="space-y-6">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      <CreatePostModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default FeedPage;
