const Forum = require('../models/Forum');

// Create a new category
exports.createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    const exists = await Forum.findOne({ name });
    if (exists) {
      return res.status(400).json({ message: 'Category already exists' });
    }

    const category = new Forum({ name, description, posts: [] });
    await category.save();
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: 'Could not create category', error: error.message });
  }
};

// Get all categories with posts
exports.getAllForumData = async (req, res) => {
  try {
    const categories = await Forum.find()
      .populate('posts.author', 'username')
      .populate('posts.comments.author', 'username')
      .sort({ createdAt: -1 });

    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load forum data', error: error.message });
  }
};

// Get categories only
exports.getCategories = async (req, res) => {
  try {
    const categories = await Forum.find({}, 'name description');
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch categories', error: error.message });
  }
};

// Create a new post in a category
exports.createPost = async (req, res) => {
  try {
    const { title, content, categoryId } = req.body;

    const forumCategory = await Forum.findById(categoryId);
    if (!forumCategory) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const newPost = {
      title,
      content,
      author: req.user.userId,
      comments: [],
    };

    forumCategory.posts.push(newPost);
    await forumCategory.save();

    // return the last added post
    const addedPost = forumCategory.posts[forumCategory.posts.length - 1];
    res.status(201).json(addedPost);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create post', error: error.message });
  }
};

// Get a specific post by ID from all categories
exports.getPostById = async (req, res) => {
  try {
    const categories = await Forum.find()
      .populate('posts.author', 'username')
      .populate('posts.comments.author', 'username');

    for (const cat of categories) {
      const post = cat.posts.find((p) => p._id.toString() === req.params.postId);
      if (post) {
        return res.status(200).json({ post, category: { _id: cat._id, name: cat.name } });
      }
    }

    return res.status(404).json({ message: 'Post not found' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch post', error: error.message });
  }
};

// Add a comment to a post
exports.addComment = async (req, res) => {
  try {
    const { content } = req.body;
    const postId = req.params.postId;

    const forumCategories = await Forum.find();

    for (const forum of forumCategories) {
      const post = forum.posts.id(postId);
      if (post) {
        post.comments.push({
          content,
          author: req.user.userId,
        });
        await forum.save();
        return res.status(201).json({ message: 'Comment added successfully' });
      }
    }

    return res.status(404).json({ message: 'Post not found' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to add comment', error: error.message });
  }
};
exports.listComments = async (req, res) => {
  try {
    const { postId } = req.params;

    // 1) Find the forum category that contains the post, populating authors
    const forum = await Forum.findOne({ 'posts._id': postId })
      .populate('posts.author', 'username')
      .populate('posts.comments.author', 'username');

    if (!forum) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // 2) Extract that post
    const post = forum.posts.id(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // 3) Return its comments array
    return res.status(200).json(post.comments);
  } catch (error) {
    console.error('❌ listComments error:', error);
    return res
      .status(500)
      .json({ message: 'Failed to list comments', error: error.message });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const userId = req.user.userId;   // from protect middleware

    // 1. Find the category containing the post
    const forum = await Forum.findOne({ 'posts._id': postId });
    if (!forum) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // 2. Locate the post
    const post = forum.posts.id(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // 3. Locate the comment
    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // 4. Only the author can delete their comment
    if (comment.author.toString() !== userId) {
      return res
        .status(403)
        .json({ message: 'You are not authorized to delete this comment.' });
    }

    // 5. Remove and save
    comment.remove();
    await forum.save();

    return res
      .status(200)
      .json({ message: 'Comment deleted successfully' });

  } catch (error) {
    console.error('❌ deleteComment error:', error);
    return res
      .status(500)
      .json({ message: 'Failed to delete comment', error: error.message });
  }
};