/** @odoo-module **/

import { DiscussContainer } from "@mail/components/discuss_container/discuss_container";
import { insertAndReplace } from '@mail/model/model_field_command';

import AbstractAction from 'web.AbstractAction';

const { App, Component } = owl;

export const DiscussWidget = AbstractAction.extend({
    template: 'mail.widgets.Discuss',
    /**
     * @override {web.AbstractAction}
     * @param {web.ActionManager} parent
     * @param {Object} action
     * @param {Object} [action.context]
     * @param {string} [action.context.active_id]
     * @param {Object} [action.params]
     * @param {string} [action.params.default_active_id]
     * @param {Object} [options={}]
     */
    init(parent, action, options={}) {
        this._super(...arguments);

        // control panel attributes
        this.action = action;
        this.actionManager = parent;
        this.discuss = undefined;
        this.options = options;

        this.app = undefined;

        this._lastPushStateActiveThread = null;
        this.env = Component.env;
        Component.env.services.messaging.modelManager.messagingCreatedPromise.then(async () => {
            const messaging = Component.env.services.messaging.modelManager.messaging;
            const initActiveId = this.options.active_id ||
                (this.action.context && this.action.context.active_id) ||
                (this.action.params && this.action.params.default_active_id) ||
                'mail.box_inbox';
            this.discuss = messaging.discuss;
            this.discuss.update({ discussView: insertAndReplace(), initActiveId });
            // Wait for messaging to be initialized to make sure the system
            // knows of the "init thread" if it exists.
            await messaging.initializedPromise;
            if (!this.discuss.isInitThreadHandled) {
                this.discuss.update({ isInitThreadHandled: true });
                if (!this.discuss.thread) {
                    this.discuss.openInitThread();
                }
            }
        });
    },
    /**
     * @override {web.AbstractAction}
     */
    destroy() {
        if (this.app) {
            this.app.destroy();
            this.app = undefined;
        }
        if (this.$buttons) {
            this.$buttons.off().remove();
        }
        this._super(...arguments);
    },
    /**
     * @override {web.AbstractAction}
     */
    async on_attach_callback() {
        this._super(...arguments);
        if (this.app) {
            // prevent twice call to on_attach_callback (FIXME)
            return;
        }
        this._pushStateActionManagerEventListener = ev => {
            ev.stopPropagation();
            if (this._lastPushStateActiveThread === this.discuss.thread) {
                return;
            }
            this._pushStateActionManager();
            this._lastPushStateActiveThread = this.discuss.thread;
        };
        this._showRainbowManEventListener = ev => {
            ev.stopPropagation();
            this._showRainbowMan();
        };
        this.el.addEventListener(
            'o-push-state-action-manager',
            this._pushStateActionManagerEventListener
        );
        this.el.addEventListener(
            'o-show-rainbow-man',
            this._showRainbowManEventListener
        );

        this.app = new App(DiscussContainer, {
            templates: window.__OWL_TEMPLATES__,
            env: owl.Component.env,
            dev: owl.Component.env.isDebug(),
            translateFn: owl.Component.env._t,
            translatableAttributes: ["data-tooltip"],
        });
        await this.app.mount(this.el);
    },
    /**
     * @override {web.AbstractAction}
     */
    on_detach_callback() {
        this._super(...arguments);
        if (this.app) {
            this.app.destroy();
        }
        this.app = undefined;
        this.el.removeEventListener(
            'o-push-state-action-manager',
            this._pushStateActionManagerEventListener
        );
        this.el.removeEventListener(
            'o-show-rainbow-man',
            this._showRainbowManEventListener
        );
    },

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * @private
     */
    _pushStateActionManager() {
        this.actionManager.do_push_state({
            action: this.action.id,
            active_id: this.discuss.activeId,
        });
    },
    /**
     * @private
     */
    _showRainbowMan() {
        this.trigger_up('show_effect', {
            message: this.env._t("Congratulations, your inbox is empty!"),
            type: 'rainbow_man',
        });
    },
});
