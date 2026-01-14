# 数据库集合快速创建参考

## 🚀 快速创建步骤

1. 打开微信开发者工具 → 云开发 → 数据库
2. 点击「+」按钮，依次创建以下 8 个集合：

---

## 📦 集合列表（按创建顺序）

### 1️⃣ users（用户表）
**权限**: 仅创建者可读写

**字段**（首次插入数据时自动创建）:
- `nickname` (String)
- `avatar_url` (String)
- `phone` (String, 可选)
- `created_at` (Date)
- `updated_at` (Date)

**推荐索引**:
- `_openid`（系统自动创建）
- ⚠️ **不需要为 `nickname` 创建索引**（仅用于展示，不作为查询条件）

---

### 2️⃣ wishes（愿望表）
**权限**: 仅创建者可读写

**字段**:
- `beneficiary_type` (String)
- `beneficiary_desc` (String)
- `deity` (String)
- `wish_text` (String)
- `time_range` (String)
- `target_quantify` (String)
- `way_boundary` (String)
- `action_commitment` (String)
- `return_wish` (String)
- `status` (Number: 0/1)
- `created_at` (Date)
- `updated_at` (Date)

**推荐索引**:
- `status` (升序)
- `created_at` (降序)

---

### 3️⃣ analyses（分析记录表）
**权限**: 仅创建者可读写

**字段**:
- `wish_id` (String, 可选)
- `wish_text` (String)
- `deity` (String, 可选)
- `analysis_result` (Object)
- `full_result` (Object, 可选)
- `unlocked` (Boolean)
- `unlock_token` (String)
- `unlock_token_expires_at` (Date)
- `unlock_token_used` (Boolean)
- `created_at` (Date)

**推荐索引**:
- `wish_id` (升序)
- `unlock_token` (升序)
- `created_at` (降序)

---

### 4️⃣ orders（订单表）
**权限**: 仅创建者可读写

**字段**:
- `wish_id` (String)
- `amount` (Number, 单位：分)
- `status` (Number: 0/1/2/3)
- `payment_id` (String)
- `out_trade_no` (String, 唯一)
- `transaction_id` (String)
- `callback_received` (Boolean)
- `created_at` (Date)
- `updated_at` (Date)

**推荐索引**:
- `status` (升序)
- `out_trade_no` (升序, **唯一索引**)
- `created_at` (降序)

---

### 5️⃣ unlock_logs（解锁日志表）
**权限**: 仅创建者可读写

**字段**:
- `analysis_id` (String)
- `unlock_type` (String, 可选: ad/share)
- `device_fingerprint` (String, 可选)
- `created_at` (Date)

**推荐索引**:
- `analysis_id` (升序)
- `created_at` (降序)

---

### 6️⃣ wish_profiles（许愿人/受益人和对象信息表）
**权限**: 仅创建者可读写

**字段**:
- `beneficiary_type` (String)
- `beneficiary_desc` (String)
- `deity` (String)
- `created_at` (Date)
- `updated_at` (Date)

**推荐索引**:
- `updated_at` (降序)

---

### 7️⃣ persons（人员信息表）
**权限**: 仅创建者可读写

**字段**:
- `name` (String)
- `category` (String)
- `id_card` (String, 可选)
- `phone` (String, 可选)
- `created_at` (Date)
- `updated_at` (Date)

**推荐索引**:
- `category` (升序)
- `updated_at` (降序)

---

### 8️⃣ person_categories（人员分类表）
**权限**: 仅创建者可读写

**字段**:
- `value` (String, 唯一标识)
- `label` (String)
- `icon` (String, 可选)
- `is_default` (Boolean)
- `created_at` (Date)
- `updated_at` (Date)

**推荐索引**:
- `value` (升序)
- `created_at` (升序)

---

## ✅ 创建完成检查

- [ ] 已创建 8 个集合
- [ ] 所有集合权限设置为「仅创建者可读写」
- [ ] 已创建必要的索引（参考上方推荐索引）

---

## 💡 提示

- **系统字段**: `_id` 和 `_openid` 会自动生成，无需手动创建
- **字段类型**: 首次插入数据时，云数据库会自动识别字段类型
- **索引创建**: 在集合详情页 → 索引 → 新建索引

---

**详细说明请参考**: `./DATABASE_SETUP.md`
