# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo.tests.common import TransactionCase


class TestProjectProfitabilityCommon(TransactionCase):

    @classmethod
    def setUpClass(cls):
        super().setUpClass()

        cls.partner = cls.env['res.partner'].create({
            'name': 'Georges',
            'email': 'georges@project-profitability.com'})

        cls.analytic_account = cls.env['account.analytic.account'].create({
            'name': 'Project - AA',
            'code': 'AA-1234',
        })
        cls.project = cls.env['project.project'].with_context({'mail_create_nolog': True}).create({
            'name': 'Project',
            'partner_id': cls.partner.id,
            'analytic_account_id': cls.analytic_account.id,
        })
        cls.task = cls.env['project.task'].with_context({'mail_create_nolog': True}).create({
            'name': 'Task',
            'project_id': cls.project.id,
        })
        cls.project_profitability_items_empty = {
            'revenues': {'data': [], 'total': {'invoiced': 0.0, 'to_invoice': 0.0}},
            'costs': {'data': [], 'total': {'billed': 0.0, 'to_bill': 0.0}},
        }


class TestProfitability(TestProjectProfitabilityCommon):
    def test_project_profitability(self):
        """ Test the project profitability has no data found

            In this module, the project profitability should have no data.
            So the no revenue and cost should be found.
        """
        profitability_items = self.project._get_profitability_items(False)
        self.assertDictEqual(
            profitability_items,
            self.project_profitability_items_empty,
            'The profitability data of the project should be return no data and so 0 for each total amount.'
        )
