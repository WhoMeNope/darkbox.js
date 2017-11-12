(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['jquery'], factory);
	} else if (typeof exports === 'object') {
		// Node. Does not work with strict CommonJS, but
		// only CommonJS-like environments that support module.exports,
		// like Node.
		module.exports = factory(require('jquery'));
	} else {
		// Browser globals (root is window)
		window.darkbox = factory(window.jQuery);
	}
}
(this, function ($) {

//////////////////////////////////
//DARKBOX BUILDER OBJECT

	function DarkboxBuilder() {
		this.init();
	}

	DarkboxBuilder.prototype.init = function () {
		$(document).ready(() => {
			this.build();
		});
	};
	DarkboxBuilder.prototype.build = function () {
		//add elements to DOM
		let elems =
		`<div id="darkboxOverlay">
		</div>
		
		<div id="darkbox">
		</div>
		<div id="darkbox-left">
			<img src="../assets/darkbox/left.svg" alt=""/>
		</div>
		<div id="darkbox-right">
			<img src="../assets/darkbox/right.svg" alt=""/>
		</div>
		<div id="darkbox-cancel">
			<img src="../assets/darkbox/close.svg" alt=""/>
		</div>
		<div id="darkbox-title">
			<h1 id="darkboxTitleText"></h1>
		</div>`;

		$(
			elems
		).appendTo(
			$('body')
		);
	};

	DarkboxBuilder.prototype.start = function ($elem, options) {
		return new Darkbox($elem, options);
	};

//////////////////////////////////
//DARKBOX INSTANCE OBJECT

	function Darkbox($elem, options) {
		//set options
		this.options = $.extend({}, this.constructor.defaults);
		this.setOptions(options);

		// Cache jQuery objects
		this.$overlay = $('#darkboxOverlay');
		this.$darkbox = $('#darkbox');

		this.$darkboxLeft = $('#darkbox-left');
		this.$darkboxRight = $('#darkbox-right');
		this.$darkboxCancel = $('#darkbox-cancel');
		this.$darkboxTitle = $('#darkbox-title');
		
		this.$darkboxTitleText = $('#darkboxTitleText');

		this.$clonnedNode = null;

		//resolve images, add current to first if needed
		if(this.options.startWithCurrent) {
			let current = $elem.attr('src');

			if(!Array.isArray(this.options.images)) {
				this.options.images = [];
			}
			if(this.options.images.length == 0 || current !== this.options.images[0]) {
				this.options.images.unshift(current);
			}
		}

		this.currentImageIndex = 0;

		//start on element
		if(this.options.images.length > 0)
			this.start($elem);
	}

	Darkbox.defaults = {
		images: [],

		disablePageScrolling: true,
		startWithCurrent: true,
		wrapAround: false,

		endCallback: null,
	};

	Darkbox.prototype.setOptions = function (options) {
		$.extend(this.options, options);
	};

	Darkbox.prototype.start = function ($link) {
		// Disable scrolling of the page while open
		if (this.options.disablePageScrolling) {
			$('body').addClass('db-disable-scrolling');
		}

		//clear darkbox
		this.$darkbox.empty();

		//clone element to darkbox and set the same position as the original
		let node = $link.clone(false);

		$(node).attr('src', this.options.images[0]);
		
		$(node).css('position', 'absolute');
		
		$(node).css('width', $link.width() + 'px');
		$(node).css('height', $link.height() + 'px');

		let offset = $link.parent().offset();
		$(node).css('left', offset.left + 'px');
		$(node).css('top', offset.top + 'px');

		$(node).appendTo(this.$darkbox);
		this.$clonnedNode = node;

		//show darkbox
		this.$darkbox.show();
		this.$overlay.addClass('show');
		this.$overlay.addClass('fill');

		this.$darkboxLeft.show();
		this.$darkboxRight.show();
		this.$darkboxCancel.show();
		this.$darkboxTitle.show();

		$(this.$darkboxTitleText).text('Image ' + (this.currentImageIndex + 1) + ' of ' + this.options.images.length);

		setTimeout(() => 
		{
			this.$darkboxLeft.addClass('show');
			this.$darkboxRight.addClass('show');
			this.$darkboxCancel.addClass('show');
			this.$darkboxTitle.addClass('show');
		}, 400);

		//transition to center position
		$(this.$clonnedNode).addClass('straight');
		$(this.$clonnedNode).animate(
		{
			left: ($(window).width() - $link.width()) / 2,
			top: ($(window).height() - $link.height()) / 2,
		}, 
		400, 
		"swing",
		() => {
			$(this.$clonnedNode).addClass('scale');

			//display animation finished

			//enable keyboard hook
			this.enableKeyboardNav();

			//enable nav events
			$(this.$darkboxLeft).on('click', () => {
				this.previousImage();
			});
			$(this.$darkboxRight).on('click', () => {
				this.nextImage();
			});

			$(this.$darkboxCancel).on('click', () => {
				this.end();
			});
		});
	};

	Darkbox.prototype.previousImage = function () {
		if (this.currentImageIndex !== 0) {
			this.changeImage(this.currentImageIndex - 1);
		} else if (this.options.wrapAround && this.options.images.length > 1) {
			this.changeImage(this.options.images.length - 1);
		}
	};
	Darkbox.prototype.nextImage = function () {
		if (this.currentImageIndex !== this.options.images.length - 1) {
			this.changeImage(this.currentImageIndex + 1);
		} else if (this.options.wrapAround && this.options.images.length > 1) {
			this.changeImage(0);
		}
	};
	Darkbox.prototype.changeImage = function (index) {
		this.currentImageIndex = index;

		$(this.$darkboxTitleText).text('Image ' + (index + 1) + ' of ' + this.options.images.length);

		$(this.$clonnedNode).attr('src', this.options.images[index]);
	}

	Darkbox.prototype.enableKeyboardNav = function () {
		$(document).on('keyup.keyboard', $.proxy(this.keyboardAction, this));
	};
	Darkbox.prototype.disableKeyboardNav = function () {
		$(document).off('.keyboard');
	};
	Darkbox.prototype.keyboardAction = function (event) {
		const KEYCODE_ESC = 27;
		const KEYCODE_LEFTARROW = 37;
		const KEYCODE_RIGHTARROW = 39;

		let keycode = event.keyCode;
		let key = String.fromCharCode(keycode).toLowerCase();
		if (keycode === KEYCODE_ESC || key.match(/x|o|c/)) {
			this.end();
		} else if (key === 'p' || keycode === KEYCODE_LEFTARROW) {
			this.previousImage();
		} else if (key === 'n' || keycode === KEYCODE_RIGHTARROW) {
			this.nextImage();
		}
	};

	Darkbox.prototype.end = function () {
		//disable keyboard hook
		this.disableKeyboardNav();

		//disable nav events
		$(this.$darkboxLeft).off('click');
		$(this.$darkboxRight).off('click');
		$(this.$darkboxCancel).off('click');

		//hide darkbox
		this.$darkboxLeft.removeClass('show');
		this.$darkboxRight.removeClass('show');
		this.$darkboxCancel.removeClass('show');
		this.$darkboxTitle.removeClass('show');

		$(this.$clonnedNode).animate(
			{
				opacity: 0.0,
			},
			300,
			"swing",
			() => {
				this.$darkbox.hide();

				this.$darkboxLeft.hide();
				this.$darkboxRight.hide();

				this.$darkboxCancel.hide();

				this.$darkboxTitle.hide();
			}
		);

		this.$overlay.removeClass('fill');
		setTimeout(() => {
			this.$overlay.removeClass('show');

			//hide animation finished

			$('body').removeClass('db-disable-scrolling');

		}, 600);

		//trigger endCallback
		let endCallback = this.options.endCallback;
		if (endCallback && endCallback != null && typeof endCallback === 'function') {
			setTimeout(() => {
				this.options.endCallback();
			}, 200);
		}
	};

	return new DarkboxBuilder();
}));
