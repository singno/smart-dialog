+function ($) {
	'use strict';

	// Borrow by bootstrap
	function transitionEnd () {
		var el = document.createElement('div');
		var transEndEventNames = {
			WebkitTransition: 'webkitTransitionEnd',
			MozTransition: 'transitionend',
			OTransition: 'oTransitionEnd otransitionend',
			transition: 'transitionend'
		};

		for (var name in transEndEventNames) {
			if (el.style[name] !== undefined) {
				return {
					end: transEndEventNames[name]
				}
			}
		}

		return false;
	}

	// http://blog.alexmaccaw.com/css-transitions
	$.fn.emulateTransitionEnd = function (duration) {
	    var called = false, 
	    	$el = this;

	    this.one($.support.transition.end, function (ev) {
	    	if (this === ev.target) {
	    		called = true; 
	    	}
	    });

	    var callback = function () { 
	    	if (called) {
	    		return ;
	    	} 

	    	$el.trigger($.support.transition.end); 
	    }

	    setTimeout(callback, duration);
	    return this;
	};

	$(function () {
	    $.support.transition = transitionEnd();
	});
}(jQuery);

+function (window, document, $) {
	'use script';

	var slice = Array.prototype.slice;

	var isIE6 = !!$('<div><!--[if IE 6]><span></span><![endif]--></div>').find('span').size(),
		$window = $(window),
		$document = $(document),
		$body = $(document.body);

	var DEFAULTS = {
		keyboard: true,
		backdrop: true,
		zIndex: null,
		buttons: [{
			text: '确定',
			trigger: 'yes',
			primary: false,
			callback: $.noop
		}],
		title: '',
		content: '',
		left: 'auto',
		top: 'auto',
		autoClose: null,
		closeButton: true,
		width: 'auto',
		height: 'auto',

		animation: true,
		autoCenter: true,
		fixed: true,

		// ["information", "question", "error", "warn", "ok"]
		icon: null,

		/* {
		 * 	  type: 'ajax' | 'iframe'
		 * 	  src: 'http://www.example.com/sd.html'
		 * }
		 */
		source: {
			width: 'auto',
			height: 'auto'
		},

		startZIndex: 999
	};

	function getZIndex () {
		return DEFAULTS.startZIndex++;	
	}

	var backdropCount = -1;

	function hasBackdrop () {
		return backdropCount > 0;
	}

	function throttle (func, wait) {
		var timer;

		return function () {
			var self = this,
				argv = slice.call(arguments);

			clearTimeout(timer);
			timer = setTimeout(function () {
				func.apply(self, argv);
			}, wait);
		};
	}

	var rformat = /\{([^}]+)\}/g;
	function format (str, data) {
	    str += '';
	    data = data || {};

	    var formatStr = str.replace(rformat, function(match, paren){
	        if(data.hasOwnProperty(paren)){
	            return data[paren];
	        }

	        return match;
	    });
	    return formatStr;
	}

	var uid = 0;
	function uniqueId () {
		return uid++;
	}

	function SmartDialog (option) {
		var options = {};

		if (typeof option === 'string') {
			options.content = option;
			$.extend(options, arguments[1]);
		} else {
			$.extend(options, option);
		}

		this.options = $.extend({}, DEFAULTS, options);
		this.uid = uniqueId();

		this.$root 
		= this.$body
		= this.$content
		= this.$text
		= this.$btns
		= this.$backdrop
		= this.$iframe // When use `source.type = 'iframe'`
		= $('<div></div>'); // Null object pattern

		this.status 
		= this.timer
		= null;

		// Use for iframe
		this.iframeData = undefined;

		// Internal event subject
		this.subject = $({});

		// Trigger event subject
		this.triggerSubject = $({});

		smartDialogs.push(this);
		Wrapper.cache[this.uid] = this;

		this.show();	
	}

	SmartDialog.prototype = {
		Event: function (type, obj) {
			obj = $.extend({
				context: this.wrap(this)
			}, obj);

			return $.Event(type, obj); 
		},

		wrap: function () {
			return new Wrapper(this.uid);	
		},

		internalTrigger: function (ev) {
			ev = typeof ev === 'string' ? this.Event(ev) : ev;
			this.subject.trigger(ev, ev.context);
		},

		dialog: function () {
			var tpl = '<div class="sd">' +
			    	'<div class="sd-body {titleCls}">' +
			      		'<div class="sd-content {iconCls}"><div class="sd-text">{content}</div></div>' +
			    	'</div>' +
			  	'</div>',
		  		titleCls = this.options.title ? '' : 'sd-without-title',
		  		iconCls = this.options.icon ? 'sd-icon-' + this.options.icon : 'sd-without-icon';

		  	this.$root = $(format(tpl, {
		  		content: this.options.content,
		  		titleCls: titleCls,
		  		iconCls: iconCls
		  	}))
		  	.addClass(this.options.rootClass)
		  	.hide().appendTo($body); 

		  	!this.options.fixed && this.$root.css('position', 'absolute');

		  	this.$body = this.$root.find('.sd-body');
		  	this.$content = this.$body.find('.sd-content');
		  	this.$text = this.$content.find('.sd-text');

		  	if (this.options.title) {
		  		this.$title = format('<h3 class="sd-title">{title}</h3>', {
		  			title: this.options.title	
		  		});
		  		this.$body.prepend(this.$title);
		  	}

		  	if (this.options.closeButton) {
		  		var $closeBtn = $('<a class="sd-close" href="javascript:">x</a>');
		  		this.$body.append($closeBtn);
		  	}

		  	if (this.options.icon) {
		  		var $icon = $('<span class="sd-icon"></span>');

		  		if (isIE6) {
		  			$icon.addClass('sd-icon-png8');
		  		}

		  		this.$content.prepend($icon);
		  	}

		  	// if (this.options.content === '') {
		  	// 	this.$text.append($('<span class="sd-loading"></span>'));
		  	// }

		  	if (this.options.buttons && this.options.buttons.length) {
		  		var btnsWrapper = '<div class="sd-btns">{buttons}</div>',
		  			btnsHtml = '';

		  		$.each(this.options.buttons, function (idx, val) {
		  			var tpl = '<a href="javascript:" class="sd-btn {btnCls}" data-sd-trigger="{trigger}">{text}</a>';
		  			var data = $.extend({
		  				btnCls: val.primary ? 'sd-btn-primary' : '',
		  				trigger: val.trigger == null ? '' : val.trigger
		  			}, val);

		  			btnsHtml += format(tpl, data);
		  		});

		  		this.$btns = $(format(btnsWrapper, {
		  			buttons: btnsHtml
		  		}));

		  		this.$root.append(this.$btns);
		  		this.bindBtn();
		  	} 

		  	this.options.source && this.loadSource();

		  	this.$root.on('click.dismiss.sd', '.sd-close', $.proxy(this.close, this));	
		  	this.$root.on('click.dismiss.sd', '[data-sd-trigger]', $.proxy(this.bindTriggerEvent, this));

			return this;
		},	

		loadSource: function () {
			var self = this,
				source = this.options.source;		

			switch (source.type) {
	  			case 'ajax':
	  				$.get(source.src)
	  				.done(function (html) {
	  					self.$text.append($(html));
	  					self.position('auto');
	  					self.internalTrigger('ajaxload');
	  				})
	  				.fail(function () {
	  					self.internalTrigger('ajaxfail');
	  				});			
	  				break;
	  			case 'iframe':
	  				var tpl = '<iframe src={src} width="{width}" height="{height}" frameborder=0 />';
	  				this.iframeData = source.data;
	  				this.$iframe = $(format(tpl, {
	  					src: source.src,
	  					width: source.width || '',
	  					height: source.height || ''
	  				}))
	  				.on('load', function () {
	  					self.adaptIframe();
	  					self.internalTrigger(self.Event('iframeload', {
	  						target: this
	  					}));
	  				})
	  				.appendTo(self.$text);
	  				this.$iframe[0].smartDialog = this.wrap();
	  				break;
	  			default:
	  				break;
	  		}
		},

		bindBtn: function () {
			var $btns = this.$btns.find('.sd-btn'),
				self = this,
				wrapper = self.wrap();

			$btns.each(function (idx) {
				var $this = $(this),
					callback = self.options.buttons[idx].callback;

				if (typeof callback === 'function') {
					$(this).on('click', function (ev) {
						ev.preventDefault();

						var result = callback.call(self.triggerSubject, {
							target: this,
							context: wrapper
						}, wrapper);

						if (result !== false) {
							self.close();
						}
					});
				}
			});
		},

		bindTriggerEvent: function (e) {
	  		e.preventDefault();

	  		var $this = $(e.target),
	  			trigger = $this.data('sdTrigger'),
	  			ev = $.Event();

	  		if (trigger) {
	  			ev = this.Event(trigger, {
	  				target: e.target
	  			});

	  			this.triggerSubject.trigger(ev, ev.context);
	  		}

	  		if (!ev.isDefaultPrevented()) {
	  			this.close();
	  		}

	  		return this;
		},

		backdrop: function () {
			this.$backdrop = $('<div class="sd-backdrop"></div>')
			.css('zIndex', this.options.zIndex == null ? getZIndex() : this.options.zIndex)
			.addClass(this.options.backdropClass);

			if (!this.options.backdrop) {
				return this;
			}

			backdropCount++;

			this.$backdrop.hide().appendTo($body);

			if (isIE6) {
				this.fullBackdrop();
			}

			if (this.options.backdrop !== 'static') {
				this.$backdrop.on('click.dismiss.sd', $.proxy(this.closeByBackdrop, this));
			}

			return this;
		},
		
		fullBackdrop: function () {
			this.$backdrop.css({
				position: 'absolute',
				height: $(document).outerHeight() + 5 // IE6计算出来的结果可能会有些偏差，`+5`保证覆盖全屏  
			});
		},

		fixHeight: function (h) {
			if (this.options.buttons && this.options.buttons.length) {
				this.$body.css('height', this.$root.height() - this.$btns.outerHeight());
			} 
			
			return this;

			// this.$text.css('padding-top', (this.$content.height() - this.$text.height()) / 2);
		},

		closeByBackdrop: function () {
			var dialog = smartDialogs[smartDialogs.length - 1];

			if (dialog === this) {
				this.close();
			}

			return this;
		},

		showEnd: function (ev) {
			// Just capture event trigger by itself
			if (ev && ev.target !== this.$root[0]) {
				return this;
			}

			if (this.status === 'shown') {
				return ;
			}

			var self = this;

			this.status = 'shown';
			this.$root.removeClass('sd-animate');
			
			// make this event async
			setTimeout(function () {
				self.internalTrigger('shown');
			}, 1);

			if (this.options.autoClose != null) {
				this.close(this.options.autoClose);
			}

			return this;
		},

		closeEnd: function (ev) {
			// Just capture event trigger by itself
			if (ev && ev.target !== this.$root[0]) {
				return this;
			}

			if (this.status === 'closed') {
				return ;
			}

			backdropCount--;

			var idx = $.inArray(this, smartDialogs);

			if (idx > -1) {
				smartDialogs.splice(idx, 1);
			}

			delete Wrapper[this.uid];

			this.$root.remove();
			this.$backdrop.remove();

			this.status = 'closed';
			this.internalTrigger('closed');

			return this;
		},

		show: function () {
			if (this.status === 'showing' || this.status === 'shown') {
				return this;
			}

			this.status = 'showing';

			this.backdrop();
			this.dialog();

			this.$root.css('zIndex', +this.$backdrop.css('zIndex') + 1);

			if (!hasBackdrop()) {
				this.$backdrop.addClass('sd-backdrop-opacity');
			}

			this.$root.show();
			this.$backdrop.show();

			if (this.options.width !== 'auto') {
				this.$root.css('width', this.options.width);
			} 

			if (this.options.height !== 'auto') {
				this.$root.css('height', this.options.height);
				this.fixHeight();
			}	

			this.$root.addClass('sd-animate');
			this.position('auto');
			this.$root.css('opacity', 1);

			$.support.transition && this.options.animation ?
			this.$root.on(
				$.support.transition.end,
				$.proxy(this.showEnd, this)
			).emulateTransitionEnd(500)
			: this.showEnd();

			return this;
		},

		close: function (e) {
			if (e && e.preventDefault) {
				e.preventDefault();
			}

			if (this.status === 'closed' || this.status === 'closing') {
				return this;
			}

			if (typeof e === 'number') {
				clearTimeout(this.timer);
				this.timer = setTimeout($.proxy(this.close, this), e);
				return this;
			} 

			var ev = this.Event('close');
			this.internalTrigger(ev);

			if (ev.isDefaultPrevented()) {
				return this;
			}

			this.$root.addClass('sd-animate');

			this.status = 'closing';

			if ($.support.transition && this.options.animation && e !== 'immediate') {
				this.$root.css({
					opacity: 0,
					top: ''
				});
				this.$backdrop.css('opacity', 0);

				this.$root.on(
					$.support.transition.end,
					$.proxy(this.closeEnd, this) 
				).emulateTransitionEnd(500);
			} else {
				this.closeEnd();
			}

			return this;
		},

		getCenterXY: function () {
			var height = this.$root.height(),
				width = this.$root.width(),
				x, y;
				
			x = ($window.width() - width) / 2;
			y = ($window.height() - height) / 2;
			
			if (isIE6) {
				x += $document.scrollLeft();
				y += $document.scrollTop();
			}
			
			return {
				x: x,
				y: y
			};
		},

		center: function () {
			var obj = this.getCenterXY();
			this.position(obj.x, obj.y);

			return this;
		},

		position: function (x, y) {
			if (arguments.length === 0) {
				return [this.$root.css('top'), this.$root.css('left')];
			}

			if (x === 'auto') {
				if (this.options.autoCenter) {
					var center = this.getCenterXY(),
						x = this.options.left,
						y = this.options.top;

					if (this.options.left === 'auto') {
						x = center.x;
					} 

					if (this.options.top === 'auto') {
						y = center.y;
					}

					this.$root.css({
						left: x,
						top: y
					});
				}
			} else if (typeof x === 'object') {
				if (x.x != null) {
					this.$root.css('left', x.x);
					this.options.left = x.x;
				} 

				if (x.y != null) {
					this.$root.css('top', x.y);
					this.options.top = x.y;
				}
			} else {
				this.$root.css({
					left: x,
					top: y
				});

				if (x != null) {
					this.options.left = x;
				}

				if (y != null) {
					this.options.top = y;
				}
			}
			
			return this;
		},

		size: function (w, h) {
			if (arguments.length === 0) {
				return [this.$root.outerWidth(), this.$root.outerHeight()];
			}

			if (typeof w === 'object') {
				if (w.width != null) {
					this.$root.css('width', w.width);
					this.options.width = w.width;
				} 

				if (w.height != null) {
					this.$root.css('height', w.height);
					this.fixHeight();
					this.options.height = w.height;
				}
			} else {
				this.$root.css({
					width: w,
					height: h
				});

				if (w != null) {
					this.options.width = w;
				}

				if (h != null) {
					this.fixHeight();
					this.options.height = h;
				}
			}

			return this;
		},

		on: function () {
			this.subject.on.apply(this.subject, arguments);
			return this;
		},

		ontrigger: function () {
			this.triggerSubject.on.apply(this.triggerSubject, arguments);
			return this;	
		},

		content: function (text) {
			if (!arguments.length) {
				return this.$text.html();
			} else {
				this.$text.html(String(text));
				this.position('auto');
				return this;
			}
		},

		title: function (text) {
			if (!arguments.length) {
				return this.$title.html();
			} else {
				this.$title.html(String(text));
				return this;
			}
		},

		adaptIframe: function () {
			try {
				var $doc = this.$iframe.contents(),
					w = $doc.width(),
					h = $doc.height();

				if (this.options.source.width == null) {
					this.$iframe.attr('width', w);
				}

				if (this.options.source.height == null) {
					this.$iframe.attr('height', h);
				}

				this.position('auto');
			} catch(ex) {
				// skip
			}
		},

		// Just use for iframe
		data: function (name, value) {
			switch (arguments.length) {
				case 0:
					return this.iframeData;
				case 1:
					if (typeof name === 'object') {
						$.extend(this.iframeData, name);
						return this;
					} else {
						return this.iframeData && this.iframeData[name]; 
					}
				case 2:
					if (this.iframeData) {
						this.iframeData[name] = value;
					}
					return this;
				default: 
					return this;
			}
		},

		domRootElement: function () {
			return this.$root[0];
		},

		changeSettings: function () {
			if (arguments.length === 2) {
				this.options[arguments[0]] = arguments[1];
			} else {
				$.extend(this.options, arguments[0]);
			}
		}	
	};

	function Wrapper (uid) {
		this.uid = uid;
	}

	Wrapper.cache = {};

	$.each(['close', 'center', 'position', 'on', 'ontrigger',
	 		'size', 'content', 'title', 'adaptIframe', 'data',
	 		'status', 'domRootElement', 'changeSettings'], function (idx, val) {

		Wrapper.prototype[val] = function () {
			var dialog = Wrapper.cache[this.uid],
				result;

			if (!dialog) {
				return ;
			} 

			var prop = dialog[val];

			if (typeof prop !== 'function') {
				return prop;
			} 
			
			result = prop.apply(dialog, arguments);

			if (result instanceof SmartDialog) {
				return this;
			} else {
				return result;
			}
		};

	});

	$.smartDialog = function (option) {
		return new SmartDialog(option, arguments[1]).wrap();	
	};

	var smartDialogs = [];

	$document.on('keyup.dismiss.sd', function (ev) {
		if (ev.which !== 27) {
			return ;
		}

		var dialog = smartDialogs[smartDialogs.length - 1];
		dialog instanceof SmartDialog && dialog.options.keyboard && dialog.close();
	});

	$window.on('resize.sd', throttle(function (ev) {
		$.each(smartDialogs, function (idx, d) {
			d.position('auto');
			if (isIE6) {
				d.fullBackdrop();
			}
		});
	}, 100));
	
	// IE6 scroll fixed
	if (isIE6) {
		$window.on('scroll.sd', throttle(function (ev) {
			$.each(smartDialogs, function (idx, d) {
				d.options.fixed && d.position('auto');
			});
		}, 200));
	}

	$.smartDialog.config = function (config) {
		$.extend(DEFAULTS, config);
	};

}(window, document, jQuery);

// Plugins
+function (window, document, $) {
	$.smartDialog.tips = function (content, autoClose) {
		var option = {
			closeButton: false,
			backdrop: false,
			buttons: null,
			rootClass: 'tips'
		};

		if (autoClose !== false) {
			autoClose += 0;
			option.autoClose = isNaN(autoClose) ? 3000 : autoClose;
		}

		return $.smartDialog(content, option);
	};

	$.smartDialog.alert = $.smartDialog.warn = function (content, title) {
		return $.smartDialog(content, {
			width: '400px',
			icon: 'warn',
			title: title 
		});
	};

	$.smartDialog.ok = function (content, title) {
		return $.smartDialog(content, {
			width: '400px',
			icon: 'ok',
			title: title
		});
	};

	$.smartDialog.info = function (content, title) {
		return $.smartDialog(content, {
			width: '400px',
			icon: 'information',
			title: title
		});
	};

	$.smartDialog.error = function (content, title) {
		return $.smartDialog(content, {
			width: '400px',
			icon: 'error',
			title: title
		});
	};

	$.smartDialog.confirm = function (content, title) {
		return $.smartDialog(content, {
			width: '400px',
			icon: 'question',
			title: title,
			buttons: [
				{
					text: '确定',
					primary: true,
					trigger: 'yes'
				},
				{
					text: '取消',
					trigger: 'cancel'
				}
			]
		});
	};

	$.smartDialog.original = function (option) {
		if (typeof option === 'string') {
			option = {
				content: option
			};
		}

		return $.smartDialog($.extend({
			closeButton: false,
			buttons: null,
			rootClass: 'original'
		}, option));
	};
}(window, document, jQuery);