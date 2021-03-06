KityMinder.registerModule( "LayoutModule", function () {
	kity.extendClass( Minder, {
		addLayoutStyle: function ( name, style ) {
			if ( !this._layoutStyles ) this._layoutStyles = {};
			this._layoutStyles[ name ] = style;
		},
		getLayoutStyle: function ( name ) {
			return this._layoutStyles[ name ];
		},
		getLayoutStyleItems: function () {
			var items = [];
			for ( var key in this._layoutStyles ) {
				items.push( key );
			}
			return items;
		},
		getCurrentStyle: function () {
			var _root = this.getRoot();
			return _root.getData( "currentstyle" );
		},
		setCurrentStyle: function ( name ) {
			var _root = this.getRoot();
			_root.setData( "currentstyle", name );
			return name;
		},
		highlightNode: function ( node ) {
			var curStyle = this.getCurrentStyle();
			this.getLayoutStyle( curStyle ).highlightNode.call( this, node );
		},
		initStyle: function () {
			var curStyle = this.getCurrentStyle();
			this._rc.remove();
			this._rc = new kity.Group();
			this._paper.addShape( this._rc );

			var _root = this.getRoot();
			_root.preTraverse( function ( n ) {
				n.clearLayout();
			} );
			this.getLayoutStyle( curStyle ).initStyle.call( this );
		},
		appendChildNode: function ( parent, node, index ) {
			var curStyle = this.getCurrentStyle();
			this.getLayoutStyle( curStyle ).appendChildNode.call( this, parent, node, index );
		},
		appendSiblingNode: function ( sibling, node ) {
			var curStyle = this.getCurrentStyle();
			this.getLayoutStyle( curStyle ).appendSiblingNode.call( this, sibling, node );
		},
		removeNode: function ( nodes ) {
			var curStyle = this.getCurrentStyle();
			this.getLayoutStyle( curStyle ).removeNode.call( this, nodes );
		},
		updateLayout: function ( node ) {
			var curStyle = this.getCurrentStyle();
			this.getLayoutStyle( curStyle ).updateLayout.call( this, node );
		},
		expandNode: function ( ico ) {
			var curStyle = this.getCurrentStyle();
			this.getLayoutStyle( curStyle ).expandNode.call( this, ico );
		}
	} );
	kity.extendClass( MinderNode, {
		setLayout: function ( k, v ) {
			if ( this._layout === undefined ) {
				this._layout = {};
			}
			var _pros = this.getLayout();
			Utils.extend( _pros, {
				k: v
			} );
			this._layout = _pros;
		},
		getLayout: function ( k ) {
			if ( k === undefined ) {
				return this._layout;
			}
			return this._layout[ k ];
		},
		clearLayout: function () {
			this._layout = {};
		}
	} );
	var switchLayout = function ( km, style ) {
		var _root = km.getRoot();
		_root.preTraverse( function ( n ) {
			n.setPoint();
			n.getBgRc().clear();
		} );
		km.setCurrentStyle( style );
		km.initStyle();
		return style;
	};
	var SwitchLayoutCommand = kity.createClass( "SwitchLayoutCommand", ( function () {
		return {
			base: Command,
			execute: switchLayout
		};
	} )() );
	var AppendChildNodeCommand = kity.createClass( "AppendChildNodeCommand", ( function () {
		return {
			base: Command,
			execute: function ( km, node ) {
				var parent = km.getSelectedNode();
				km.appendChildNode( parent, node );
				km.select( node, true );
				return node;
			},
			queryState: function ( km ) {
				var selectedNode = km.getSelectedNode();
				if ( !selectedNode ) {
					return -1;
				} else {
					return 0;
				}
			}
		};
	} )() );
	var AppendSiblingNodeCommand = kity.createClass( "AppendSiblingNodeCommand", ( function () {
		return {
			base: Command,
			execute: function ( km, node ) {
				var selectedNode = km.getSelectedNode();
				if ( selectedNode.isRoot() ) {
					node.setType( "main" );
					km.appendChildNode( selectedNode, node );
				} else {
					node.setType( "sub" );
					km.appendSiblingNode( selectedNode, node );
				}
				km.select( node, true );
				return node;
			},
			queryState: function ( km ) {
				var selectedNodes = km.getSelectedNodes();
				//没选中节点和单选root的时候返回不可执行
				if ( selectedNodes.length === 0 || ( selectedNodes.length === 1 && selectedNodes[ 0 ] === km.getRoot() ) ) {
					return -1;
				} else {
					return 0;
				}
			}
		};
	} )() );
	var RemoveNodeCommand = kity.createClass( "RemoveNodeCommand", ( function () {
		return {
			base: Command,
			execute: function ( km ) {
				var selectedNodes = km.getSelectedNodes();
				var _root = km.getRoot();
				var _buffer = [];
				for ( var i = 0; i < selectedNodes.length; i++ ) {
					_buffer.push( selectedNodes[ i ] );
				}
				do {
					var parent = _buffer[ 0 ].getParent();
					if ( parent && _buffer.indexOf( parent ) === -1 ) _buffer.push( parent );
					_buffer.shift();
				} while ( _buffer.length > 1 );
				km.removeNode( selectedNodes );
				km.select( _buffer[ 0 ] );
			},
			queryState: function ( km ) {
				var selectedNodes = km.getSelectedNodes();
				if ( selectedNodes.length === 0 || ( selectedNodes.length === 1 && selectedNodes[ 0 ] === km.getRoot() ) ) {
					return -1;
				} else {
					return 0;
				}
			}
		};
	} )() );

	return {
		"commands": {
			"appendchildnode": AppendChildNodeCommand,
			"appendsiblingnode": AppendSiblingNodeCommand,
			"removenode": RemoveNodeCommand,
			"switchlayout": SwitchLayoutCommand
		},
		"events": {
			"ready": function () {
				this.setDefaultOptions( 'layoutstyle', this.getLayoutStyleItems() );
				switchLayout( this, this.getOptions( 'defaultlayoutstyle' ) );
			},
			"click": function ( e ) {
				var ico = e.kityEvent.targetShape && e.kityEvent.targetShape.container;
				if ( ico && ico.class === "shicon" ) {
					this.expandNode( ico );
				}
			},
			"resize": function ( e ) {
				clearTimeout( this._lastStyleResetTimeout );
				this._lastStyleResetTimeout = setTimeout( function () {
					this.updateLayout( this.getRoot() );
				}.bind( this ), 100 );
			},
			"import": function ( e ) {
				this.initStyle( this.getRoot() );
			}
		},
		"defaultOptions": {
			"defaultlayoutstyle": "default",
			"node": {
				'appendsiblingnode': 'appendsiblingnode',
				'appendchildnode': 'appendchildnode',
				'removenode': 'removenode'
			}
		}
	};
} );