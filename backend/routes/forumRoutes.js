const express = require('express');
const router = express.Router();
const forumController = require('../controllers/forumController');
const { protect } = require('../middleware/authMiddleware');

router.post('/category', protect, forumController.createCategory);
router.get('/categories', forumController.getCategories);
router.get('/', forumController.getAllForumData);
router.post('/post', protect, forumController.createPost);
router.get('/:postId', forumController.getPostById);
router.post('/:postId/comment', protect, forumController.addComment);
router.get(
    '/:postId/comments',

    forumController.listComments
  );
module.exports = router;
