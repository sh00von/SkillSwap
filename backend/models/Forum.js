// models/Forum.js
const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
  },
  { timestamps: true }
);

const PostSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    comments: [CommentSchema],
  },
  { timestamps: true }
);

const ForumCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    description: String,
    posts: [PostSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Forum', ForumCategorySchema);
