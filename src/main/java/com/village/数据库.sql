CREATE TABLE `user` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `phone` varchar(11) NOT NULL COMMENT '手机号（登录账号）',
  `password` varchar(100) DEFAULT NULL COMMENT '密码（BCrypt加密）',
  `role` enum('villager','village_official','merchant','admin') NOT NULL COMMENT '角色：村民、村干部、商户、乡镇管理员',
  `status` tinyint(4) NOT NULL DEFAULT '0' COMMENT '状态：0-待审核（村干部/商户注册后），1-正常，2-禁用',
  `real_name` varchar(50) DEFAULT NULL COMMENT '真实姓名',
  `avatar` varchar(255) DEFAULT NULL COMMENT '头像URL',
  `village_id` bigint(20) DEFAULT NULL COMMENT '所属村庄ID（关联village表）',
  `address` varchar(255) DEFAULT NULL COMMENT '详细地址',
  `gender` tinyint(4) DEFAULT NULL COMMENT '性别：1-男，2-女，0-未知',
  `audit_remark` varchar(255) DEFAULT NULL COMMENT '审核备注（审核不通过原因）',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `last_login_time` datetime DEFAULT NULL COMMENT '最后登录时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_phone` (`phone`),
  KEY `idx_role` (`role`),
  KEY `idx_status` (`status`),
  KEY `idx_village_id` (`village_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';


CREATE TABLE `village` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `name` varchar(100) NOT NULL COMMENT '村庄名称',
  `town` varchar(100) DEFAULT NULL COMMENT '所属乡镇',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='村庄表';


CREATE TABLE `notice` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `title` varchar(200) NOT NULL COMMENT '标题',
  `content` text NOT NULL COMMENT '内容（富文本）',
  `type` varchar(50) DEFAULT 'policy' COMMENT '类型：policy政策通知，emergency紧急通知',
  `publisher_id` bigint(20) NOT NULL COMMENT '发布者ID（关联user表，村干部或管理员）',
  `village_id` bigint(20) DEFAULT NULL COMMENT '发布范围村庄ID（null表示全乡镇）',
  `voice_url` varchar(255) DEFAULT NULL COMMENT '语音播报文件URL（百度API生成）',
  `attachments` json DEFAULT NULL COMMENT '附件列表（存储文件URL数组）',
  `is_voice` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否生成语音播报',
  `read_count` int(11) NOT NULL DEFAULT '0' COMMENT '阅读量',
  `like_count` int(11) NOT NULL DEFAULT '0' COMMENT '点赞数',
  `comment_count` int(11) NOT NULL DEFAULT '0' COMMENT '评论数',
  `status` tinyint(4) NOT NULL DEFAULT '1' COMMENT '状态：0-草稿，1-已发布，2-已删除',
  `publish_time` datetime DEFAULT NULL COMMENT '发布时间',
  `expire_time` datetime DEFAULT NULL COMMENT '过期时间',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_publisher_id` (`publisher_id`),
  KEY `idx_village_id` (`village_id`),
  KEY `idx_status` (`status`),
  KEY `idx_publish_time` (`publish_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='通知表';


CREATE TABLE `notice_read` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `notice_id` bigint(20) NOT NULL COMMENT '通知ID',
  `user_id` bigint(20) NOT NULL COMMENT '阅读用户ID',
  `read_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '阅读时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_notice_user` (`notice_id`,`user_id`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='通知阅读记录表';


CREATE TABLE `notice_comment` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `notice_id` bigint(20) NOT NULL COMMENT '通知ID',
  `user_id` bigint(20) NOT NULL COMMENT '评论用户ID',
  `content` varchar(500) NOT NULL COMMENT '评论内容',
  `like_count` int(11) DEFAULT '0' COMMENT '点赞数',
  `parent_id` bigint(20) DEFAULT NULL COMMENT '父评论ID（回复评论）',
  `status` tinyint(4) DEFAULT '1' COMMENT '状态：0-删除，1-正常',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_notice_id` (`notice_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_parent_id` (`parent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='通知评论表';


CREATE TABLE `village_affair` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `title` varchar(200) NOT NULL COMMENT '标题',
  `type` enum('financial','meeting','notice') NOT NULL COMMENT '类型：财务报表、会议纪要、公示公告',
  `content` text NOT NULL COMMENT '内容',
  `village_id` bigint(20) NOT NULL COMMENT '所属村庄ID',
  `publisher_id` bigint(20) NOT NULL COMMENT '发布者ID（村干部）',
  `attachments` json DEFAULT NULL COMMENT '附件列表',
  `start_date` date NOT NULL COMMENT '公示开始日期',
  `end_date` date NOT NULL COMMENT '公示结束日期',
  `allow_feedback` tinyint(1) NOT NULL DEFAULT '1' COMMENT '是否允许异议反馈',
  `status` tinyint(4) NOT NULL DEFAULT '1' COMMENT '状态：0-草稿，1-已发布，2-已过期，3-已删除',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_village_id` (`village_id`),
  KEY `idx_publisher_id` (`publisher_id`),
  KEY `idx_status` (`status`),
  KEY `idx_date_range` (`start_date`,`end_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='村务表';


CREATE TABLE `affair_feedback` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `affair_id` bigint(20) NOT NULL COMMENT '村务ID',
  `user_id` bigint(20) NOT NULL COMMENT '提出异议的村民ID',
  `content` varchar(500) NOT NULL COMMENT '异议内容',
  `attachments` json DEFAULT NULL COMMENT '附件',
  `reply_content` varchar(500) DEFAULT NULL COMMENT '村干部回复内容',
  `reply_time` datetime DEFAULT NULL COMMENT '回复时间',
  `reply_user_id` bigint(20) DEFAULT NULL COMMENT '回复人ID（村干部）',
  `status` tinyint(4) NOT NULL DEFAULT '0' COMMENT '状态：0-待回复，1-已回复，2-已关闭',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_affair_id` (`affair_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='村务异议反馈表';


CREATE TABLE `product` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `farmer_id` bigint(20) NOT NULL COMMENT '发布者ID（农户，关联user表）',
  `name` varchar(100) NOT NULL COMMENT '产品名称',
  `type` varchar(50) NOT NULL COMMENT '产品类型（蔬菜/水果/手工艺品等）',
  `origin` varchar(200) NOT NULL COMMENT '产地',
  `specifications` varchar(100) DEFAULT NULL COMMENT '规格（如5斤/箱）',
  `price` decimal(10,2) NOT NULL COMMENT '价格（元/斤或元/件）',
  `total_output` decimal(10,2) DEFAULT NULL COMMENT '总产量',
  `description` text COMMENT '详细描述',
  `images` json NOT NULL COMMENT '图片URL数组（至少3张）',
  `trade_mode` enum('wholesale','retail') NOT NULL COMMENT '交易模式：批发/零售',
  `contact_phone` varchar(11) DEFAULT NULL COMMENT '联系电话',
  `status` tinyint(4) NOT NULL DEFAULT '0' COMMENT '状态：0-待审核，1-已上架，2-已下架，3-审核不通过',
  `audit_remark` varchar(255) DEFAULT NULL COMMENT '审核备注',
  `view_count` int(11) NOT NULL DEFAULT '0' COMMENT '浏览次数',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_farmer_id` (`farmer_id`),
  KEY `idx_type` (`type`),
  KEY `idx_status` (`status`),
  KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='农产品表';


CREATE TABLE `service_demand` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `user_id` bigint(20) NOT NULL COMMENT '发布需求村民ID',
  `service_type` varchar(50) NOT NULL COMMENT '服务类型',
  `description` varchar(500) NOT NULL COMMENT '需求描述',
  `budget` decimal(10,2) DEFAULT NULL COMMENT '预算金额',
  `address` varchar(255) NOT NULL COMMENT '联系地址',
  `contact_phone` varchar(11) NOT NULL COMMENT '联系电话',
  `status` tinyint(4) NOT NULL DEFAULT '0' COMMENT '状态：0-待抢单，1-已接单，2-服务中，3-待评价，4-已完成，5-已取消',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_service_type` (`service_type`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='服务需求表';


CREATE TABLE `service_order` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `demand_id` bigint(20) NOT NULL COMMENT '服务需求ID',
  `merchant_id` bigint(20) NOT NULL COMMENT '接单商户ID',
  `status` tinyint(4) NOT NULL DEFAULT '1' COMMENT '订单状态：1-已接单，2-服务中，3-待评价，4-已完成，5-已取消',
  `service_proof` json DEFAULT NULL COMMENT '服务完成凭证（照片URL数组）',
  `evaluation` varchar(500) DEFAULT NULL COMMENT '村民评价内容',
  `evaluation_score` tinyint(4) DEFAULT NULL COMMENT '评价分数（1-5星）',
  `evaluation_time` datetime DEFAULT NULL COMMENT '评价时间',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_demand_id` (`demand_id`),
  KEY `idx_merchant_id` (`merchant_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='服务订单表';


CREATE TABLE `vote` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `title` varchar(200) NOT NULL COMMENT '投票主题',
  `description` varchar(500) DEFAULT NULL COMMENT '描述',
  `village_id` bigint(20) NOT NULL COMMENT '所属村庄ID',
  `initiator_id` bigint(20) NOT NULL COMMENT '发起人ID（村干部）',
  `is_anonymous` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否匿名投票（0-实名，1-匿名）',
  `start_time` datetime NOT NULL COMMENT '开始时间',
  `end_time` datetime NOT NULL COMMENT '截止时间',
  `status` tinyint(4) NOT NULL DEFAULT '1' COMMENT '状态：0-草稿，1-进行中，2-已结束，3-已删除',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_village_id` (`village_id`),
  KEY `idx_initiator_id` (`initiator_id`),
  KEY `idx_status` (`status`),
  KEY `idx_time_range` (`start_time`,`end_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='投票表';


CREATE TABLE `vote_option` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `vote_id` bigint(20) NOT NULL COMMENT '投票ID',
  `option_text` varchar(200) NOT NULL COMMENT '选项文本',
  `vote_count` int(11) NOT NULL DEFAULT '0' COMMENT '得票数',
  `sort_order` tinyint(4) DEFAULT '0' COMMENT '排序',
  PRIMARY KEY (`id`),
  KEY `idx_vote_id` (`vote_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='投票选项表';


CREATE TABLE `vote_record` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `vote_id` bigint(20) NOT NULL COMMENT '投票ID',
  `user_id` bigint(20) NOT NULL COMMENT '投票用户ID',
  `option_id` bigint(20) NOT NULL COMMENT '所选选项ID',
  `vote_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '投票时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_vote_user` (`vote_id`,`user_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_option_id` (`option_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='投票记录表';


