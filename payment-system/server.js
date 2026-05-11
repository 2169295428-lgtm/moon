const express = require('express');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const orders = new Map();
const PAYMENT_EXPIRE_TIME = 5 * 60 * 1000;

function generateOrderId() {
    return 'PAY' + Date.now().toString(36).toUpperCase() + uuidv4().slice(0, 6).toUpperCase();
}

function createOrder(amount, description) {
    const orderId = generateOrderId();
    const order = {
        id: orderId,
        amount: parseFloat(amount),
        description: description || '商品支付',
        status: 'pending',
        createdAt: Date.now(),
        expireAt: Date.now() + PAYMENT_EXPIRE_TIME,
        paidAt: null,
        paymentMethod: null
    };
    orders.set(orderId, order);
    return order;
}

function cleanExpiredOrders() {
    const now = Date.now();
    for (const [id, order] of orders) {
        if (order.status === 'pending' && order.expireAt < now) {
            order.status = 'expired';
            orders.set(id, order);
        }
    }
}

setInterval(cleanExpiredOrders, 30000);

app.post('/api/order/create', (req, res) => {
    const { amount, description } = req.body;
    
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
        return res.status(400).json({ 
            success: false, 
            message: '请输入有效的支付金额' 
        });
    }

    const order = createOrder(amount, description);
    
    res.json({
        success: true,
        data: {
            orderId: order.id,
            amount: order.amount,
            description: order.description,
            expireAt: order.expireAt,
            createdAt: order.createdAt
        }
    });
});

app.get('/api/order/:orderId/qrcode', async (req, res) => {
    const { orderId } = req.params;
    const order = orders.get(orderId);
    
    if (!order) {
        return res.status(404).json({ 
            success: false, 
            message: '订单不存在' 
        });
    }

    if (order.status !== 'pending') {
        return res.status(400).json({ 
            success: false, 
            message: `订单状态为 ${order.status}，无法支付` 
        });
    }

    try {
        const qrData = JSON.stringify({
            orderId: order.id,
            amount: order.amount,
            merchant: 'DEMO_PAY',
            timestamp: Date.now()
        });
        
        const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
            width: 300,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#ffffff'
            }
        });
        
        res.json({
            success: true,
            data: {
                orderId: order.id,
                qrCode: qrCodeDataUrl,
                amount: order.amount,
                expireAt: order.expireAt
            }
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: '生成二维码失败' 
        });
    }
});

app.get('/api/order/:orderId/status', (req, res) => {
    const { orderId } = req.params;
    const order = orders.get(orderId);
    
    if (!order) {
        return res.status(404).json({ 
            success: false, 
            message: '订单不存在' 
        });
    }

    res.json({
        success: true,
        data: {
            orderId: order.id,
            status: order.status,
            amount: order.amount,
            description: order.description,
            paidAt: order.paidAt,
            paymentMethod: order.paymentMethod,
            expireAt: order.expireAt
        }
    });
});

app.post('/api/order/:orderId/pay', (req, res) => {
    const { orderId } = req.params;
    const { paymentMethod } = req.body;
    const order = orders.get(orderId);
    
    if (!order) {
        return res.status(404).json({ 
            success: false, 
            message: '订单不存在' 
        });
    }

    if (order.status !== 'pending') {
        return res.status(400).json({ 
            success: false, 
            message: `订单状态为 ${order.status}，无法支付` 
        });
    }

    if (Date.now() > order.expireAt) {
        order.status = 'expired';
        orders.set(orderId, order);
        return res.status(400).json({ 
            success: false, 
            message: '订单已过期' 
        });
    }

    order.status = 'paid';
    order.paidAt = Date.now();
    order.paymentMethod = paymentMethod || 'alipay';
    orders.set(orderId, order);

    res.json({
        success: true,
        message: '支付成功',
        data: {
            orderId: order.id,
            status: order.status,
            paidAt: order.paidAt,
            paymentMethod: order.paymentMethod
        }
    });
});

app.post('/api/order/:orderId/cancel', (req, res) => {
    const { orderId } = req.params;
    const order = orders.get(orderId);
    
    if (!order) {
        return res.status(404).json({ 
            success: false, 
            message: '订单不存在' 
        });
    }

    if (order.status !== 'pending') {
        return res.status(400).json({ 
            success: false, 
            message: `订单状态为 ${order.status}，无法取消` 
        });
    }

    order.status = 'cancelled';
    orders.set(orderId, order);

    res.json({
        success: true,
        message: '订单已取消',
        data: {
            orderId: order.id,
            status: order.status
        }
    });
});

app.get('/api/orders', (req, res) => {
    const orderList = Array.from(orders.values())
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 50);
    
    res.json({
        success: true,
        data: orderList
    });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`支付系统已启动: http://localhost:${PORT}`);
});
