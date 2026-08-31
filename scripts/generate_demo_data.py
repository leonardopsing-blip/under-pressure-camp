import json, re
from pathlib import Path

analysis = json.loads(Path('/home/ubuntu/under-pressure-camp/source_analysis.json').read_text())

def normalize(value):
    value = (value or '').lower().strip()
    for a,b in {'á':'a','é':'e','í':'i','ó':'o','ú':'u','ü':'u','ñ':'n'}.items():
        value = value.replace(a,b)
    value = re.sub(r'[^a-z0-9]+', ' ', value)
    return re.sub(r'\s+', ' ', value).strip()

def tokens(value):
    return set(normalize(value).split())

def best_payment_match(campista_name, pagos):
    camp_tokens = tokens(campista_name)
    best = None
    best_score = 0
    for p in pagos:
        pay_tokens = tokens(p['name'])
        score = len(camp_tokens & pay_tokens)
        if score > best_score:
            best = p
            best_score = score
    return best if best_score >= 2 else None

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
    p = best_payment_match(c['fullName'], analysis['pagos'])
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
        'paidPercentage': (p.get('paidPercentage', 0) if p else 0),
        'paidAmount': (p.get('amount', 0) if p else 0),
        'pendingAmount': (p.get('pending', 100) if p else 100),
        'paymentStatusLabel': status_label(status),
        'paymentStatusColor': status_color(status),
        'sourceRow': c['rowNumber'],
        'paymentSourceRow': p['rowNumber'] if p else None,
        'paymentMethod': p['method'] if p else '',
        'paymentDetail': p['detail'] if p else '',
        'matchedPaymentName': p['name'] if p else '',
    })

out = {
    'summary': analysis['summary'],
    'generatedAt': '2026-08-31T15:58:00-05:00',
    'operationalSpreadsheetId': json.loads(Path('/home/ubuntu/operational_sheet.json').read_text())['spreadsheetId'],
    'operationalSpreadsheetUrl': json.loads(Path('/home/ubuntu/operational_sheet.json').read_text())['spreadsheetUrl'],
    'campistas': campistas,
}
Path('/home/ubuntu/under-pressure-camp/data').mkdir(exist_ok=True)
Path('/home/ubuntu/under-pressure-camp/data/campistas-demo.json').write_text(json.dumps(out, ensure_ascii=False, indent=2))
print(len(campistas))
print(sum(1 for c in campistas if c['paymentStatus'] == 'pagado'), sum(1 for c in campistas if c['paymentStatus'] == 'abonado'), sum(1 for c in campistas if c['paymentStatus'] == 'no_pagado'))
