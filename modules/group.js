/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Fox Splitter.
 *
 * The Initial Developer of the Original Code is YUKI "Piro" Hiroshi.
 * Portions created by the Initial Developer are Copyright (C) 2007-2012
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):: YUKI "Piro" Hiroshi <piro.outsider.reflex@gmail.com>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

load('base');
load('lib/jsdeferred');

var EXPORTED_SYMBOLS = ['FoxSplitterGroup'];
 
function FoxSplitterGroup() 
{
	this.init();
}
FoxSplitterGroup.prototype = {
	__proto__ : FoxSplitterBase.prototype,

	isGroup : true,

	get id()
	{
		return this.members.length == 2 ?
				this.startMember.id+':'+this.endMember.id :
				null ;
	},

	get x()
	{
		var member = this.leftMember || this.topMember;
		return member ? member.imaginaryX : 0 ;
	},
	get y()
	{
		var member = this.topMember || this.leftMember;
		return member ? member.imaginaryY : 0 ;
	},
	get width()
	{
		var base = this.leftMember;
		var another = this.rightMember;
		return base && another ? base.imaginaryWidth + another.imaginaryWidth : this.startMember.imaginaryWidth ;
	},
	get height()
	{
		var base = this.topMember;
		var another = this.bottomMember;
		return base && another ? base.imaginaryHeight + another.imaginaryHeight : this.startMember.imaginaryHeight ;
	},

	get imaginaryX()
	{
		return this.x;
	},
	get imaginaryY()
	{
		return this.y;
	},
	get imaginaryWidth()
	{
		return this.width;
	},
	get imaginaryHeight()
	{
		return this.height;
	},
	stretched : false,

	get topMember()
	{
		return this._getMemberAt(this.POSITION_TOP);
	},
	get rightMember()
	{
		return this._getMemberAt(this.POSITION_RIGHT);
	},
	get bottomMember()
	{
		return this._getMemberAt(this.POSITION_BOTTOM);
	},
	get leftMember()
	{
		return this._getMemberAt(this.POSITION_LEFT);
	},
	get startMember()
	{
		return this.topMember || this.leftMember;
	},
	get endMember()
	{
		return this.bottomMember || this.rightMember;
	},
	_getMemberAt : function FSG_getMemberAt(aPosition)
	{
		var member = null;
		this.members.some(function(aMember) {
			return member = aMember.position == aPosition ? aMember : null ;
		});
		return member;
	},
	get stretchedMember()
	{
		var found = null;
		this.allWindows.some(function(aWindow) {
			if (aWindow.stretched)
				return found = aWindow;
			else
				return false;
		});
		return found;
	},

	get allWindows()
	{
		var members = this.members;
		members.forEach(function(aMember) {
			if (aMember.isGroup)
				members = members.concat(aMember.allWindows);
		});
		return members.filter(function(aMember) {
			return !aMember.isGroup;
		}).sort(this._sortWindows);
	},

	_sortWindows : function FSG_sortWindows(aA, aB)
	{
		return aA.imaginaryY - aB.imaginaryY || aA.imaginaryX - aB.imaginaryX;
	},

	get hasMinimizedWindow()
	{
		return this.members.some(function(aMember) {
			return aMember.isGroup ?
					aMember.hasMinimizedWindow :
					aMember.windowState == aMember.window.STATE_MINIMIZED ;
		});
	},

	get main()
	{
		return !!this.mainWindow;
	},
	set main(aValue)
	{
		if (aValue) this.members[0].main = true;
		return aValue;
	},

	get mainWindow()
	{
		return this.realMainWindow || this.firstWindow;
	},
	get realMainWindow()
	{
		var mainWindow = null;
		this.members.some(function(aMember) {
			return aMember.isGroup ?
					(mainWindow = aMember.realMainWindow) :
					aMember.main ? (mainWindow = aMember) : null ;
		});
		return mainWindow;
	},
	get firstWindow()
	{
		var firstWindow = null;
		this.members.some(function(aMember) {
			return firstWindow = aMember.isGroup ? aMember.firstWindow : aMember ;
		});
		return firstWindow;
	},

	get state()
	{
		var state = {
				id       : this.id,
				position : this.position ? this.positionName[this.position] : null ,
				members  : {}
			};
		var top = this.topMember;
		if (top) state.members.top = top.isGroup ? top.state : top.id ;
		var left = this.leftMember;
		if (left) state.members.left = left.isGroup ? left.state : left.id ;
		var bottom = this.bottomMember;
		if (bottom) state.members.bottom = bottom.isGroup ? bottom.state : bottom.id ;
		var right = this.rightMember;
		if (right) state.members.right = right.isGroup ? right.state : right.id ;
		return state;
	},


	init : function FSG_init() 
	{
		this.parent = null;
		this.resetting = 0;
		this.members = [];
		this.binding = 0;

		FoxSplitterGroup.instances.push(this);
	},
 
	destroy : function FSG_destroy() 
	{
		this.members.forEach(function(aMember) {
			this.unregister(aMember);
		}, this);

		if (this.parent) {
			this._restoreSiblingScrollPosition();
			this.parent.unregister(this);
		}

		FoxSplitterGroup.instances = FoxSplitterGroup.instances.filter(function(aFSGroup) {
			return aFSGroup != this;
		}, this);
	},



	moveTo : function FSG_moveTo(aX, aY, aSource)
	{
		this.moveBy(aX - this.x, aY - this.y, aSource);
	},

	moveBy : function FSG_moveBy(aDX, aDY, aSource)
	{
		this.members.forEach(function(aMember) {
			if (aMember != aSource)
				aMember.moveBy(aDX, aDY, aSource);
		});
	},

	resizeTo : function FSG_resizeTo(aW, aH)
	{
		return this.resizeBy(aW - this.width, aH - this.height);
	},

	resizeBy : function FSG_resizeBy(aDW, aDH)
	{
		var stretchedMember = this.stretchedMember;
		if (stretchedMember) {
			let self = this;
			return stretchedMember.shrink()
					.next(function() {
						return self._resizeByInternal(aDW, aDH);
					})
					.next(function() {
						return stretchedMember.stretch();
					});
		}
		else {
			return this._resizeByInternal(aDW, aDH);
		}
	},
	_resizeByInternal : function FSG_resizeByInternal(aDW, aDH)
	{
		var deferreds = [];
		if (aDW) {
			let right = this.rightMember;
			if (right) {
				// expand both members!
				let halfDW = Math.round(aDW / 2);

				this.leftMember.resizeBy(halfDW, 0);

				right.moveBy(halfDW, 0);
				deferreds.push(right.resizeBy(aDW - halfDW, 0));
			}
			else {
				this.members.forEach(function(aMember) {
					deferreds.push(aMember.resizeBy(aDW, 0));
				});
			}
		}
		if (aDH) {
			let bottom = this.bottomMember;
			if (bottom) {
				// expand both members!
				let halfDH = Math.round(aDH / 2);

				this.topMember.resizeBy(0, halfDH);

				bottom.moveBy(0, halfDH);
				deferreds.push(bottom.resizeBy(0, aDH - halfDH));
			}
			else {
				this.members.forEach(function(aMember) {
					deferreds.push(aMember.resizeBy(0, aDH));
				});
			}
		}
		return deferreds.length ?
			Deferred.parallel(deferreds) : Deferred.next(function() {}) ;
	},

	raise : function FSG_raise(aFinallyRaised)
	{
		var deferreds = [];
		this.allWindows.forEach(function(aMember) {
			if (aFinallyRaised == aMember)
				return;
			var deferred = aMember.raise(aFinallyRaised);
			if (deferred)
				deferreds.push(deferred);
		});
		if (aFinallyRaised) {
			this.memberClass.raising++;
			if (deferreds.length) {
				let self = this;
				Deferred
					.parallel(deferreds)
					.next(function() {
						aFinallyRaised.raise();
						self.memberClass.raising--;
					});
			}
			else {
				aFinallyRaised.raise();
				this.memberClass.raising--;
			}
		}
	},

	canClose : function FSG_canClose(aExceptionMember)
	{
		return this.members.every(function(aMember) {
			return (
				aMember == aExceptionMember ||
				aMember.canClose(aExceptionMember)
			);
		});
	},

	close : function FSG_close(aForce)
	{
		this.closeExcept(null, aForce);
	},

	closeExcept : function FSG_closeExcept(aExceptionMember, aForce)
	{
		if (aForce || this.canClose(aExceptionMember)) {
			this.members.slice(0).forEach(function(aMember) {
				if (aMember != aExceptionMember)
					if (aMember.isGroup)
						aMember.closeExcept(aExceptionMember, true);
					else
						aMember.close(true);
			});
			if (aExceptionMember && !aExceptionMember.isGroup)
				aExceptionMember.clearGroupedAppearance();
		}
	},


	setGroupedAppearance : function FSG_setGroupedAppearance()
	{
		this.members.forEach(function(aMember) {
			aMember.setGroupedAppearance();
		});
	},

	updateGroupedAppearance : function FSG_updateGroupedAppearance()
	{
		this.members.forEach(function(aMember) {
			aMember.updateGroupedAppearance();
		});
	},

	clearGroupedAppearance : function FSG_clearGroupedAppearance()
	{
		this.members.forEach(function(aMember) {
			aMember.clearGroupedAppearance();
		});
	},


	// group specific features

	register : function FSG_register(aMember)
	{
		if (this.members.indexOf(aMember) < 0) {
			this.members.push(aMember);
			aMember.parent = this;
		}
	},

	unregister : function FSG_unregister(aMember)
	{
		var index = this.members.indexOf(aMember);
		if (index > -1) {
			this.members.splice(index, 1);
			if (aMember.parent == this)
				aMember.parent = null;
		}
		if (this.members.length <= 1) {
			let lastMember = this.members[0];
			if (lastMember) {
				if (this.parent) {
					// swap existing relations
					lastMember.position = this.position;
					this.parent.register(lastMember);
					this.unregister(lastMember);
				}
				if (this.maximized)
					this.setMaximizedState(lastMember);
			}
			this.destroy();
		}
	},


	reserveResetPositionAndSize : function FSG_reserveResetPositionAndSize(aBaseMember, aForce)
	{
		var deferred = new Deferred();

		if (this._reservedResetPositionAndSize) {
			this._reservedResetPositionAndSize.cancel();
			delete this._reservedResetPositionAndSize;
		}

		if (this._lastReserveResetPositionAndSize) {
			this._lastReserveResetPositionAndSize.call();
			delete this._lastDeferred;
		}

		if (aForce)
			this._lastReserveResetPositionAndSizeForce = true;

		var self = this;
		this._reservedResetPositionAndSize = Deferred.wait(0.5);
		this._reservedResetPositionAndSize
			.next(function() {
				var force = self._lastReserveResetPositionAndSizeForce;
				delete self._reservedResetPositionAndSize;
				delete self._lastReserveResetPositionAndSize;
				delete self._lastReserveResetPositionAndSizeForce;
				self.resetPositionAndSize(aBaseMember, force);
				deferred.call();
			})
			.error(this.defaultHandleError);

		this._lastReserveResetPositionAndSize = deferred;

		return deferred.error(this.defaultHandleError);
	},

	// reposition/resize grouped windows based on their relations
	resetPositionAndSize : function FSG_resetPositionAndSize(aBaseMember, aForce)
	{
		if (
			this.resetting ||
			this.hasMinimizedWindow ||
			this.members.length < 2
			)
			return;

		this.resetting++;

		try {
			var base = aBaseMember;
			if (!base || base.parent != this)
				base = this.startMember;
			var another = base.sibling;

			base.updateLastPositionAndSize();
			another.updateLastPositionAndSize();

			if (base.isGroup)
				base.resetPositionAndSize(aBaseMember, aForce);
			if (another.isGroup)
				another.resetPositionAndSize(aBaseMember, aForce);


			var expectedX = base.position & this.POSITION_VERTICAL ?
							base.imaginaryX :
						base.position & this.POSITION_LEFT ?
							base.imaginaryX + base.imaginaryWidth :
							base.imaginaryX - another.imaginaryWidth ;
			var expectedY = base.position & this.POSITION_HORIZONTAL ?
							base.imaginaryY :
						base.position & this.POSITION_TOP ?
							base.imaginaryY + base.imaginaryHeight :
							base.imaginaryY - another.imaginaryHeight ;
			if (aForce || another.imaginaryX != expectedX || another.imaginaryY != expectedY)
				another.moveTo(expectedX, expectedY);

			var expectedWidth = base.position & this.POSITION_VERTICAL ?
								base.imaginaryWidth : another.imaginaryWidth ;
			var expectedHeight = base.position & this.POSITION_HORIZONTAL ?
								base.imaginaryHeight : another.imaginaryHeight ;
			if (aForce || another.imaginaryWidth != expectedWidth || another.imaginaryHeight != expectedHeight)
				another.resizeTo(expectedWidth, expectedHeight);

			if (this.parent)
				this.parent.resetPositionAndSize(this, aForce);
		}
		catch(e) {
			this.dumpError(e, 'FoxSplitter: FAILED TO RESET POSITION AND SIZE!');
		}

		this.resetting--;
	},

	updateLastPositionAndSize : function FSG_updateLastPositionAndSize(aNewSize)
	{
		this.lastX      = this.imaginaryX;
		this.lastY      = this.imaginaryY;
		this.lastWidth  = this.imaginaryWidth;
		this.lastHeight = this.imaginaryHeight;
	},


	maximize : function FSG_maximize()
	{
		this.allWindows[0].maximize();
	},

	minimize : function FSG_minimize()
	{
		this.allWindows[0].minimize();
	},

	restore : function FSG_restore(aTriggerFSWindow)
	{
		if (this.maximized)
			return this._restoreFromMaximized(aTriggerFSWindow);
		else if (this.minimized)
			return this._restoreFromMinimized(aTriggerFSWindow);

		return Deferred.next(function() {});
	},


	readyToMaximize : function FSG_readyToMaximize()
	{
		if (
			this.maximized ||
			(
				'_normalX' in this &&
				'_normalY' in this &&
				'_normalWidth' in this &&
				'_normalHeight' in this
			)
			)
			return;

		this._normalX = this.x;
		this._normalY = this.y;
		this._normalWidth = this.width;
		this._normalHeight = this.height;
	},

	maximizeTo : function FSG_maximizeTo(aOptions)
	{
		this.moveTo(aOptions.x, aOptions.y);
		this.resizeTo(aOptions.width, aOptions.height);

		this.maximized = true;
		this.fullscreen = aOptions.fullScreen;
	},

	_restoreFromMaximized : function FSG_restoreFromMaximized()
	{
		if (!this.maximized || !('_normalX' in this))
			return Deferred.next(function() {});

		this.moveTo(this._normalX, this._normalY);
		this.resizeTo(this._normalWidth, this._normalHeight);
		delete this._normalX;
		delete this._normalY;
		delete this._normalWidth;
		delete this._normalHeight;

		this.maximized = false;
		this.fullscreen = false;

		return Deferred.next(function() {});
	},

	setMaximizedState : function FSG_setMaximizedState(aFSWindow)
	{
		if (!this.maximized || !('_normalX' in this))
			return;

		var x = this._normalX;
		var y = this._normalY;
		var width = this._normalWidth;
		var height = this._normalHeight;
		var fullscreen = this.fullscreen;
		Deferred
			.next(function() {
				aFSWindow.moveTo(x, y);
				return aFSWindow.resizeTo(width, height);
			})
			.next(function() {
				if (fullscreen)
					return aFSWindow.fullscreen();
				else
					return aFSWindow.maximize();
			})
			.error(this.defaultHandleError);
	},


	minimize : function FSG_minimize(aTriggerFSWindow)
	{
		this.minimized = true;

		var focused = null;
		this.allWindows.some(function(aFSWindow) {
			if (aFSWindow.active)
				return focused = aFSWindow;
			return false;
		});

		this.allWindows.forEach(function(aFSWindow) {
			if (aFSWindow != focused && !aFSWindow.minimized)
				aFSWindow.window.minimize();
		});

		/**
		 * The active window must be minimized with delay, because
		 * this process possibly focuses to a minimized window in this group
		 * even if it has been already minimized in the same event loop.
		 */
		if (focused)
			Deferred.next(function() {
				if (!focused.minimized)
					focused.window.minimize();
			})
			.error(this.defaultHandleError);
	},

	_restoreFromMinimized : function FSG_restoreFromMinimized(aTriggerFSWindow)
	{
		if (!this.minimized)
			return Deferred.next(function() {});

		this.allWindows.forEach(function(aFSWindow) {
			if (aFSWindow.minimized)
				aFSWindow.window.restore();
		});

		var deferred;
		if (aTriggerFSWindow && aTriggerFSWindow.parent)
			deferred = aTriggerFSWindow.parent.reserveResetPositionAndSize(aTriggerFSWindow);
		else
			deferred = this.reserveResetPositionAndSize();

		this.minimized = false;

		return deferred || Deferred.next(function() {});
	}
};

FoxSplitterBase.prototype.groupClass = FoxSplitterGroup;

FoxSplitterGroup.instances = [];
FoxSplitterGroup.getInstanceById = function FSG_getInstanceById(aId) {
	var found = null;
	this.instances.some(function(aInstance) {
		if (aInstance.id == aId)
			return found = aInstance;
		return false;
	});
	return found;
};
