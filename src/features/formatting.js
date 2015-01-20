
var FORMATS = [
	'bold',
	'italic',
	'underline'
];

export default {

	componentWillMount () {
		this.registerStateClassResolver(
			this.getActiveFormats
		);
	},


	getActiveFormats () {
		if (this.hasSelection()) {
			try {
				return FORMATS.filter(x=>document.queryCommandState(x)).join(' ');
			} catch (e) {
				console.error(e.stack || e.message || e);
			}
		}

		return '';
	},


	onSetFormat (e) {
		e.preventDefault();
		e.stopPropagation();

		var style = e.target.getAttribute('data-format');
		this.applyFormat(style);
		this.wasInteractedWith();
	},


	applyFormat (style) {
		if (document.queryCommandSupported(style)) {
			document.execCommand(style, false, false);
		}
	}

};
