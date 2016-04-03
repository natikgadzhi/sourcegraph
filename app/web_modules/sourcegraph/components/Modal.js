import React from "react";

import Component from "sourcegraph/Component";

import CSSModules from "react-css-modules";
import styles from "./styles/modal.css";

class Modal extends Component {
	constructor(props) {
		super(props);
		this._onClick = this._onClick.bind(this);
	}

	reconcileState(state, props) {
		Object.assign(state, props);
	}

	_onClick(e) {
		if (e.target === this.refs.modal_container) {
			if (this.state.onDismiss) this.state.onDismiss();
		}
	}

	render() {
		return (
			<div ref="modal_container"
				styleName={this.state.shown ? "container" : "hidden"}
				onClick={this._onClick}>
					{this.state.children}
			</div>
		);
	}
}

Modal.propTypes = {
	shown: React.PropTypes.bool.isRequired,
	onDismiss: React.PropTypes.func,
};

export default CSSModules(Modal, styles);
