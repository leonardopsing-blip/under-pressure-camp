import json
from pathlib import Path

analysis = json.loads(Path('/home/ubuntu/under-pressure-camp/source_analysis.json').read_text())
pagos_by_name = {p['searchKey']: p for p in analysis['pagos']}

def status_label(status):
    return {'pagado':'Pagado','abonado':'Abonado','no_pagado':'No pagado'}.get(status, 'No pagado')

def status_color(status):
    return {'pagado':'#16A34A','abonado':'#F59E0B','no_pagado':'#DC2626'}.get(status, '#DC2626')

def contact_text(contact):
    if not contact:
        return ''
    name = (contact.get('name') or '').strip()
    phone = (contact.get('phone') or '').strip()
    return f'{name} {phone}'.strip()

campistas = []
for c in analysis['campistas']:
    p = pagos_by_name.get(c['searchKey'])
    status = p['status'] if p else 'no_pagado'
    contacts = c['emergencyContacts']
    campistas.append({
        'id': c['idNumber'],
        'fullName': c['fullName'],
        'idNumber': c['idNumber'],
        'age': c['age'],
        'phone': c['phone'],
        'emergencyContacts': [contact_text(x) for x in contacts if contact_text(x)],
        'homeNetworkAttends': c['homeNetworkAttends'],
        'homeNetworkName': c['homeNetworkName'],
        'hasDisease': c['hasDisease'],
        'diseaseDetail': c['diseaseDetail'],
        'takesMedication': c['takesMedication'],
        'medicationDetail': c['medicationDetail'],
        'hasAllergy': c['hasAllergy'],
        'allergyDetail': c['allergyDetail'],
        'treatmentDiet': c['treatmentDiet'],
        'paymentStatus': status,
        'paymentStatusLabel': status_label(status),
        'paymentStatusColor': status_color(status),
        'sourceRow': c['rowNumber'],
        'paymentSourceRow': p['rowNumber'] if p else None,
        'paymentMethod': p['method'] if p else '',
        'paymentDetail': p['detail'] if p else '',
    })

out = {
    'summary': analysis['summary'],
    'generatedAt': '2026-08-31T15:30:00-05:00',
    'operationalSpreadsheetId': json.loads(Path('/home/ubuntu/operational_sheet.json').read_text())['spreadsheetId'],
    'operationalSpreadsheetUrl': json.loads(Path('/home/ubuntu/operational_sheet.json').read_text())['spreadsheetUrl'],
    'campistas': campistas,
}
Path('/home/ubuntu/under-pressure-camp/data').mkdir(exist_ok=True)
Path('/home/ubuntu/under-pressure-camp/data/campistas-demo.json').write_text(json.dumps(out, ensure_ascii=False, indent=2))
print(len(campistas))
