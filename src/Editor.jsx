import * as React from 'react/addons';
import Headings from './features/heading';
import KeyHandlers, {isBackspaceKey} from './features/key-handlers';
import Selection from './features/selection';
import Formatting from './features/formatting';
import {
	getNodeText,
	getNodeTagName
} from './features/common';

export default React.createClass({
	displayName: 'Editor',

	mixins: [
		Selection,
		KeyHandlers,
		Headings,
		Formatting
	],


	propTypes: {
		data: React.PropTypes.object
	},


	getInitialState () {
		return {
			content: {},
			rootKey: 'root'
		};
	},


	getDefaultProps () {
		return {
			data: {}
		};
	},


	componentWillMount () {
		this.setState({
			content: this.addKeysToTags(this.props.data, this.state.rootKey)
		});
	},


	addKeysToTags (content, previousLevel) {
		if (!content) {
			return content;
		}

		content.key = previousLevel;

		if (content.childNodes) {
			content.childNodes.map((item, index) => {
				if (item.nodeType !== 3) {//3 === Node.TEXT_NODE
					let key = previousLevel + '.' + index;
					item.key = key;
					this.addKeysToTags(item, key);
				}
				return item;
			});
		}

		return content;
	},


	convertToJson () {
		if (!this.isMounted()) {
			return {};
		}
		return this.traverse(this.refs.editor.getDOMNode());
	},


	traverse (node) {
		var childNodes = node.childNodes.map(childNode=>{

			if (childNode.nodeType === 1) {//1 === Node.ELEMENT_NODE
				return this.traverse(childNode);
			}

			//assume text node?
			return ({
				nodeType: childNode.nodeType,
				textContent: getNodeText(node)
			});
		});


		return {
			nodeType: node.nodeType,
			tagName: getNodeTagName(node),
			childNodes: childNodes
		};
	},


	updateState (content, selectionElTagKey, selectionStart){
		return this.setState({
			content: content,
			selectionElTagKey: selectionElTagKey,
			selectionStart: selectionStart || 0
		});
	},


	onKeyPress (event) {
		event.preventDefault();
		event.stopPropagation();

		if (event.key === 'Enter') {
			this.handleEnterKey();
		}
		else {
			this.handleCharacterChange(true, event.key);
		}
	},


	onKeyDown (event) {
		console.log('onKeyDown: %s',event.key);

		if (isBackspaceKey(event.key)) {
			event.preventDefault();
			event.stopPropagation();
			return this.handleCharacterChange(false, event.key);
		}
	},


	componentDidUpdate () {
		var editorNode = this.refs.editor.getDOMNode();
		var selection = window.getSelection();
		var range = document.createRange();

		var el = editorNode.querySelector("[data-tag-key='" + this.state.selectionElTagKey + "']");
		if (!el) {
			console.warn('Could not update selection because could not get the selectionElTagKey');
			return;
		}

		if (this.state.selectionStart === 'last-character') {
			el = el.lastChild;
			range.setStart(el, el.length);
		}
		else {
			if (el.firstChild) {
				el = el.firstChild;
				range.setStart(el, this.state.selectionStart);
			}
			else {
				range.setStartBefore(el);
			}
		}

		range.collapse(true);

		selection.removeAllRanges();
		selection.addRange(range);
	},


	renderEditorContent (node) {
		var {childNodes, tagName, key} = (node || {});

		var args = [{ 'data-tag-key': key || 'root' }];

		if (tagName === 'br') {//just check for unary/childless (support <img/> tags)
			args = [];//unary tags can have props... todo: just filter out tag-key?
		}

		else if (childNodes){
			//render the children!
			let c = childNodes.map(n =>
				n.nodeType === 3 ?//if node is a Node.TEXT_NODE,
					getNodeText(n) :// then return the textContent,
					this.renderEditorContent(n));//otherwise, just recurse
			let textNodeCount = c.filter(n=>typeof n === 'string').length;
			if (textNodeCount === c.length) {
				c = c.join('');
			}
			else if (textNodeCount !== 0){
				console.warn('React will create spans our data structure does not know about because there are mixed text/element nodes in this elements children');
			}

			args.push(c);
		}

		if (!tagName) {
			console.warn ('The node\s tagName is missing! %o', node);
		}

		return React.createElement(tagName || 'p', ...args);
	},


	render () {
		return (
			<div className="react-rte">
				<div className="rte-toolbar">
					<button onClick={this.applyHeadingOne}>H1</button>
					<button onClick={this.applyHeadingTwo}>H2</button>
					<button onClick={this.applyHeadingThree}>H3</button>
					<button onClick={this.applyHeadingFour}>H4</button>
					<button onClick={this.applyBoldFormat}>B</button>
					<button onClick={this.applyItalicFormat}>I</button>
					<button onClick={this.applyUnderlineFormat}>U</button>
					<button onClick={this.applyStriketroughFormat}>S</button>
				</div>

				<div ref="editor" style={{whiteSpace: "pre", minHeight: "1em"}}
					contentEditable={true}
					onKeyPress={this.onKeyPress}
					onKeyDown={this.onKeyDown}>
					{this.renderEditorContent(this.state.content)}
				</div>
			</div>
		);
	}
});
