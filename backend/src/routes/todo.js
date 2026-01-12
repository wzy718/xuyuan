/**
 * TODO/愿望列表相关路由
 */
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { Wish } = require('../db/models');

/**
 * 获取愿望列表
 * GET /api/todos
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const status = req.query.status !== undefined ? parseInt(req.query.status) : null;

    const wishes = await Wish.findByUserId(userId, status);

    res.json({
      code: 0,
      data: wishes
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 新增愿望
 * POST /api/todos
 */
router.post('/', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const wishData = req.body;

    if (!wishData.wish_text || !wishData.wish_text.trim()) {
      return res.status(400).json({
        code: -1,
        msg: '愿望原文不能为空'
      });
    }

    const wish = await Wish.create(userId, wishData);

    res.json({
      code: 0,
      data: wish
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 更新愿望
 * PUT /api/todos/:id
 */
router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const wishId = parseInt(req.params.id);
    const updates = req.body;

    // 验证愿望属于当前用户
    const wish = await Wish.findById(wishId);
    if (!wish || wish.user_id !== userId) {
      return res.status(404).json({
        code: -1,
        msg: '愿望不存在'
      });
    }

    const updatedWish = await Wish.update(wishId, updates);

    res.json({
      code: 0,
      data: updatedWish
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 删除愿望
 * DELETE /api/todos/:id
 */
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const wishId = parseInt(req.params.id);

    const deleted = await Wish.delete(wishId, userId);

    if (!deleted) {
      return res.status(404).json({
        code: -1,
        msg: '愿望不存在'
      });
    }

    res.json({
      code: 0,
      msg: '删除成功'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
