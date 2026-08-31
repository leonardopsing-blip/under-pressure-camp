import json
import re
from pathlib import Path

BASE = Path('/home/ubuntu')


def load_values(path):
    data = json.loads(Path(path).read_text())
    return data.get('values', [])


def clean(value):
    return str(value or '').strip()


def normalize_key(value):
    value = clean(value).lower()
    replacements = {
        'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u', 'ü': 'u', 'ñ': 'n'
    }
    for src, dst in replacements.items():
        value = value.replace(src, dst)
    value = re.sub(r'[^a-z0-9]+', ' ', value)
    return re.sub(r'\s+', ' ', value).strip()


def parse_money(value):
    text = clean(value)
    if not text:
        return None
    text = text.replace('$', '').replace(',', '').strip()
    try:
        return float(text)
    except ValueError:
        return None


def split_emergency_contacts(text):
    raw = clean(text)
    if not raw:
        return []
    chunks = re.split(r'\s{2,}|\s*/\s*|\s+y\s+', raw)
    contacts = []
    for chunk in chunks:
        chunk = clean(chunk)
        if not chunk:
            continue
        phones = re.findall(r'(?:\+?593\s*)?(?:0?9\d[\d\s.-]{6,}\d)', chunk)
        name = re.sub(r'(?:\+?593\s*)?(?:0?9\d[\d\s.-]{6,}\d)', '', chunk)
        name = re.sub(r'[:\-/]+', ' ', name)
        name = re.sub(r'\s+', ' ', name).strip(' .')
        if phones:
            for phone in phones:
                contacts.append({'name': name or None, 'phone': re.sub(r'\D+', '', phone)})
        else:
            digits = re.findall(r'\d{7,}', re.sub(r'\D+', ' ', chunk))
            for phone in digits:
                contacts.append({'name': name or None, 'phone': phone})
    deduped = []
    seen = set()
    for item in contacts:
        key = (item.get('name'), item.get('phone'))
        if key not in seen:
            seen.add(key)
            deduped.append(item)
    return deduped[:4]


def yes_no(value):
    text = normalize_key(value)
    if text in {'si', 'sí'}:
        return 'Sí'
    if text in {'no'}:
        return 'No'
    return clean(value) or 'No especificado'


def payment_status(monto, pendiente):
    if pendiente is not None and pendiente <= 0:
        return 'pagado'
    if monto is not None and monto > 0:
        return 'abonado'
    return 'no_pagado'


def main():
    campistas_values = load_values(BASE / 'campistas_full.json')
    registro_values = load_values(BASE / 'pagos_registro_full.json')
    comprobantes_values = load_values(BASE / 'pagos_comprobantes_full.json')

    campistas = []
    for idx, row in enumerate(campistas_values[1:], start=2):
        row += [''] * (24 - len(row))
        emergency = split_emergency_contacts(row[8])
        item = {
            'rowNumber': idx,
            'timestamp': clean(row[0]),
            'fullName': clean(row[1]),
            'idNumber': clean(row[2]),
            'birthDate': clean(row[3]),
            'age': clean(row[4]),
            'phone': clean(row[6]),
            'emergencyContacts': emergency,
            'homeNetworkAttends': yes_no(row[11]),
            'homeNetworkName': clean(row[12]),
            'hasDisease': yes_no(row[14]),
            'diseaseDetail': clean(row[15]),
            'takesMedication': yes_no(row[16]),
            'medicationDetail': clean(row[17]),
            'hasAllergy': yes_no(row[18]),
            'allergyDetail': clean(row[19]),
            'treatmentDiet': clean(row[20]),
            'searchKey': normalize_key(row[1]),
        }
        campistas.append(item)

    registro_headers = registro_values[1]
    pagos = []
    for idx, row in enumerate(registro_values[2:], start=3):
        row += [''] * (len(registro_headers) - len(row))
        name = clean(row[1] if len(row) > 1 else '')
        if not name:
            continue
        monto = parse_money(row[2] if len(row) > 2 else '')
        pendiente = parse_money(row[3] if len(row) > 3 else '')
        pagos.append({
            'rowNumber': idx,
            'name': name,
            'searchKey': normalize_key(name),
            'amount': monto,
            'pending': pendiente,
            'method': clean(row[4] if len(row) > 4 else ''),
            'contact': clean(row[5] if len(row) > 5 else ''),
            'detail': clean(row[6] if len(row) > 6 else ''),
            'status': payment_status(monto, pendiente),
        })

    comprobantes = []
    for idx, row in enumerate(comprobantes_values, start=1):
        for col, value in enumerate(row, start=1):
            text = clean(value)
            if text:
                comprobantes.append({'rowNumber': idx, 'column': col, 'value': text})

    summary = {
        'campistasCount': len(campistas),
        'pagosCount': len(pagos),
        'comprobantesCells': len(comprobantes),
        'paymentStatusCounts': {
            'pagado': sum(1 for p in pagos if p['status'] == 'pagado'),
            'abonado': sum(1 for p in pagos if p['status'] == 'abonado'),
            'no_pagado': sum(1 for p in pagos if p['status'] == 'no_pagado'),
        },
        'campistasWithDisease': sum(1 for c in campistas if c['hasDisease'] == 'Sí'),
        'campistasWithAllergy': sum(1 for c in campistas if c['hasAllergy'] == 'Sí'),
        'campistasWithMedication': sum(1 for c in campistas if c['takesMedication'] == 'Sí'),
        'campistasWithHomeNetwork': sum(1 for c in campistas if c['homeNetworkAttends'] == 'Sí'),
    }

    out = {
        'summary': summary,
        'campistas': campistas,
        'pagos': pagos,
        'comprobantes': comprobantes,
    }
    Path('/home/ubuntu/under-pressure-camp/source_analysis.json').write_text(json.dumps(out, ensure_ascii=False, indent=2))
    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
