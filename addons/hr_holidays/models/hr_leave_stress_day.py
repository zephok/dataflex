# Part of Odoo. See LICENSE file for full copyright and licensing details.
from dateutil.relativedelta import relativedelta
from random import randint

from odoo import api, fields, models


class StressDay(models.Model):
    _name = 'hr.leave.stress.day'
    _description = 'Stress Day'
    _order = 'start_date desc, end_date desc'

    name = fields.Char(required=True)
    company_id = fields.Many2one('res.company', default=lambda self: self.env.company, required=True)
    start_date = fields.Date(required=True)
    end_date = fields.Date(required=True)
    color = fields.Integer(default=lambda dummy: randint(1, 11))
    resource_calendar_id = fields.Many2one('resource.calendar', 'Working Hours',
        default=lambda self: self.env.company.resource_calendar_id.id, domain="['|', ('company_id', '=', False), ('company_id', '=', company_id)]")

    _sql_constraints = [
        ('date_from_after_day_to', 'CHECK(start_date <= end_date)', 'The start date must be anterior than the end date.')
    ]

    @api.model
    def get_stress_days(self, start_date, end_date, resource_calendar_id=None):
        resource_calendar_id = resource_calendar_id or self.env.user.employee_id.resource_calendar_id or self.env.company.resource_calendar_id
        all_days = {}
        stress_days = self.env['hr.leave.stress.day'].search([
            ('start_date', '>=', start_date),
            ('end_date', '<=', end_date),
            '|',
                ('resource_calendar_id', '=', False),
                ('resource_calendar_id', '=', resource_calendar_id.id),
        ])

        for stress_day in stress_days:
            num_days = (stress_day.end_date - stress_day.start_date).days
            for d in range(num_days + 1):
                all_days[str(stress_day.start_date + relativedelta(days=d))] = stress_day.color

        return all_days
