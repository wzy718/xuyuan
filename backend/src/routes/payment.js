/**
 * 支付相关路由
 */
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { Order } = require('../db/models');
const { generateOrderNo } = require('../utils/token');

/**
 * 创建支付订单
 * POST /api/payment/create
 */
router.post('/create', authenticate, async (req, res, next) => {
  try {
    const { wish_id, deity, wish_text, note } = req.body;
    const userId = req.user.id;

    // 创建订单
    const order = await Order.create(userId, {
      wish_id: wish_id || null,
      amount: 100, // 1元 = 100分
      out_trade_no: generateOrderNo()
    });

    // 这里应该调用微信支付API创建支付订单
    // 由于需要微信支付商户号等配置，这里返回模拟数据
    // 实际实现需要：
    // 1. 调用微信支付统一下单API
    // 2. 返回支付参数给前端调起支付

    res.json({
      code: 0,
      data: {
        order_id: order.id,
        out_trade_no: order.out_trade_no,
        amount: order.amount,
        // 微信支付参数（实际应从微信支付API获取）
        payment_params: {
          timeStamp: Math.floor(Date.now() / 1000).toString(),
          nonceStr: Math.random().toString(36).substring(2, 15),
          package: `prepay_id=wx${Date.now()}`,
          signType: 'RSA',
          paySign: 'mock_sign'
        }
      }
    });
  } catch (error) {
    console.error('创建支付订单失败:', error);
    next(error);
  }
});

/**
 * 支付回调
 * POST /api/payment/callback
 */
router.post('/callback', async (req, res, next) => {
  try {
    // 这里应该：
    // 1. 验证微信支付回调签名
    // 2. 检查订单状态（防重复处理）
    // 3. 更新订单状态
    // 4. 返回成功响应给微信

    const { out_trade_no, transaction_id, result_code } = req.body;

    if (result_code !== 'SUCCESS') {
      return res.status(400).json({
        code: -1,
        msg: '支付失败'
      });
    }

    // 查找订单
    const order = await Order.findByOutTradeNo(out_trade_no);

    if (!order) {
      return res.status(404).json({
        code: -1,
        msg: '订单不存在'
      });
    }

    // 检查是否已处理（幂等性）
    if (order.callback_received && order.status === 1) {
      return res.json({
        code: 0,
        msg: '订单已处理'
      });
    }

    // 更新订单状态
    await Order.update(order.id, {
      status: 1, // 已支付
      transaction_id: transaction_id,
      callback_received: true,
      callback_count: order.callback_count + 1
    });

    // 返回成功给微信
    res.json({
      code: 0,
      msg: 'success'
    });
  } catch (error) {
    console.error('支付回调处理失败:', error);
    next(error);
  }
});

module.exports = router;
