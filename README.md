### 通用弹框组件

####用法：

1.五种基本状态
	
	$.smartDialog.info('这是不带情感的内容',  '这是标题，可有可无');
	$.smartDialog.confirm('这里要你做出确认，你确定吗？', '这是标题，可有可无');
	$.smartDialog.error('系统出错了，给个提示吧', '这是标题，可有可无');
	$.smartDialog.warn('弹出个警告，你是不是哪里操作错了', '这是标题，可有可无');
	$.smartDialog.ok('恭喜你，完成了注册~', '这是标题，可有可无');
	
2.三秒消失轻提示

	$.smartDialog.tips('默认我是3秒消失哦，但是你把我设置为2秒了', 2);   
	
3.不要自带的样式，完全自己控制

	$.smartDialog.original(html);
	
4.完整参数与自定义事件

	$.smartDialog({
		content: '这是内容哦~<a href="#" data-sd-trigger="clickme">点击我</a>', 
		title: '这时标题',
		keyborad: true, // 按ESC键弹窗消失，默认true
		backdrop: true, // 是否需要半透明蒙版，默认true
		buttons: [{
			text: '确定',
			trigger: 'yes',
			primary: true,  // 高亮按钮
			callback: $.noop // 可以放到后面监听
		}, {
			text: '取消',
			trigger: 'cancel',
			primary: true,  // 高亮按钮
			callback: $.noop // 可以放到后面监听
		}]
		// 还有好多参数先不写了
	}).ontrigger('clickme', function (ev) {
		// data-sd-trigger="clickme"触发的事件
		ev.preventDefault(); // 调用ev.preventDefault()才不会关闭弹框哦~
	}).ontrigger('yes', function (ev) {
		// 按钮属性 trigger: 'yes' 触发的事件
		ev.preventDefault();   
	}).ontrigger('cancel', $.noop)
	.on('close', function () {
		// "on" 监听的是内部事件，用户无法指定的哦~
		alert('我准备关闭了~');
	});
	
	
	
			