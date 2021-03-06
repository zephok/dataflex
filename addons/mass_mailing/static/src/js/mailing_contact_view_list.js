/** @odoo-module **/

import ListController from 'web.ListController';
import ListView from 'web.ListView';
import viewRegistry from 'web.view_registry';


/**
 * List view for the <mailing.contact> model.
 *
 * Add an import button to open the wizard <mailing.contact.import>. This wizard
 * allows the user to import contacts line by line.
 */
const MailingContactController = ListController.extend({
    buttons_template: 'MailingContactListView.buttons',

    events: Object.assign({}, ListController.prototype.events, {
        'click .o_mass_mailing_import_contact': '_onImport',
    }),

    _onImport() {
        this.do_action('mass_mailing.mailing_contact_import_action', {
            additional_context: this.renderer.state.context,
        });
    }
});

const MailingContactView = ListView.extend({
    config: Object.assign({}, ListView.prototype.config, {
        Controller: MailingContactController,
    }),
});

viewRegistry.add('mailing_contact_list', MailingContactView);
