// ============================================
// WORK MANAGER 98 - Complete Application
// Windows 98 themed fiber-optic work manager
// ============================================

// ============================================
// SECTION 1: I18N
// ============================================
let lang = 'es';
const i18n = {
    es: {
        navDashboard:'Dashboard', navClients:'Clientes', navOrders:'Ordenes', navProjects:'Proyectos', navInvoicing:'Facturacion', navPrices:'Precios',
        totalProjects:'Proyectos', totalDPs:'DPs', totalClients:'Clientes',
        status108:'108 - Tiefbau', status109:'109 - Einblasen', status103:'103 - Hausbegehung', status102:'102 - Abliefern', status101:'101', status100:'100 - Termin', status0:'0 - Sin progreso', statusFertig:'Fertig',
        ordersRA:'Ordenes Soplado RA', ordersRD:'Ordenes Soplado RD', ordersFusion:'Ordenes Fusion',
        projectProgress:'Progreso por Proyecto', markInvoiced:'Marcar Facturado',
        avgMargin:'Margen Promedio', totalItems:'Items', priceVersion:'Version Precios',
        thCode:'Codigo', thDescription:'Descripcion', thUnit:'Unidad', thSalePrice:'Precio Venta', thCostPrice:'Precio Costo', thMarginEur:'Margen', thMarginPct:'Margen %',
        noData:'Sin datos', imported:'importados', detected:'Detectado',
        blowingDone:'Soplado AP-DP', splicingAP:'Empalme AP', splicingDP:'Empalme DP',
        completion:'Completado', total:'Total', addresses:'direcciones',
        certNotInv:'Certificado sin facturar', totalInvoiced:'Total Facturado', totalPending:'Pendiente',
        faltaCargar:'Falta cargar orden', yaExistia:'Ya existia', resultadoImport:'Resultado de Importacion',
        nuevas:'Nuevas', importadas:'Importadas', faltan:'Faltan por cargar',
        gereedEnGO:'GEREED en GO pero sin orden', ordenesCargadas:'Ordenes cargadas',
        clickExpandir:'Click para ver detalle DPs', dpNumber:'DP', sopladoRA:'Soplado RA',
        fusionAP:'Fusion AP', fusionDP:'Fusion DP', statusCol:'Estado', pendiente:'Pendiente',
        winDashboard:'Dashboard', winClients:'Clientes', winOrders:'Ordenes de Trabajo',
        winProjects:'Proyectos', winInvoicing:'Facturacion', winPrices:'Lista de Precios',
        winAbout:'Acerca de Work Manager',
    },
    de: {
        navDashboard:'Dashboard', navClients:'Kunden', navOrders:'Auftrage', navProjects:'Projekte', navInvoicing:'Abrechnung', navPrices:'Preise',
        totalProjects:'Projekte', totalDPs:'DPs', totalClients:'Kunden',
        status108:'108 - Tiefbau', status109:'109 - Einblasen', status103:'103 - Hausbegehung', status102:'102 - Abliefern', status101:'101', status100:'100 - Termin', status0:'0 - Kein Fortschritt', statusFertig:'Fertig',
        ordersRA:'Einblasen RA Auftrage', ordersRD:'Einblasen RD Auftrage', ordersFusion:'Spleissen Auftrage',
        projectProgress:'Fortschritt pro Projekt', markInvoiced:'Als abgerechnet markieren',
        avgMargin:'Durchschn. Marge', totalItems:'Positionen', priceVersion:'Preisversion',
        thCode:'Code', thDescription:'Beschreibung', thUnit:'Einheit', thSalePrice:'Verkaufspreis', thCostPrice:'Kostenpreis', thMarginEur:'Marge', thMarginPct:'Marge %',
        noData:'Keine Daten', imported:'importiert', detected:'Erkannt',
        blowingDone:'Einblasen AP-DP', splicingAP:'Spleissen AP', splicingDP:'Spleissen DP',
        completion:'Abgeschlossen', total:'Gesamt', addresses:'Adressen',
        certNotInv:'Zertifiziert, nicht abgerechnet', totalInvoiced:'Gesamt abgerechnet', totalPending:'Ausstehend',
        faltaCargar:'Auftrag fehlt', yaExistia:'Bereits vorhanden', resultadoImport:'Importergebnis',
        nuevas:'Neue', importadas:'Importiert', faltan:'Fehlen noch',
        gereedEnGO:'GEREED in GO aber kein Auftrag', ordenesCargadas:'Geladene Auftrage',
        clickExpandir:'Klick fur DP-Details', dpNumber:'DP', sopladoRA:'Einblasen RA',
        fusionAP:'Spleissen AP', fusionDP:'Spleissen DP', statusCol:'Status', pendiente:'Ausstehend',
        winDashboard:'Dashboard', winClients:'Kunden', winOrders:'Arbeitsauftrage',
        winProjects:'Projekte', winInvoicing:'Abrechnung', winPrices:'Preisliste',
        winAbout:'Uber Work Manager',
    }
};
function t(k) { return i18n[lang]?.[k] || i18n.es[k] || k; }
function setLang(l) {
    lang = l;
    document.getElementById('lang-indicator').textContent = l.toUpperCase();
    document.querySelectorAll('[data-t]').forEach(el => {
        const k = el.getAttribute('data-t');
        const v = t(k);
        if (v !== k) el.textContent = v;
    });
    // Update window titles
    WM.windows.forEach((info, id) => {
        const titleKey = 'win' + id.charAt(0).toUpperCase() + id.slice(1);
        const titleEl = info.el.querySelector('.title-bar-text');
        if (titleEl && t(titleKey) !== titleKey) titleEl.textContent = t(titleKey);
    });
    renderOpenWindows();
}
function toggleLanguage() {
    setLang(lang === 'es' ? 'de' : 'es');
}

// ============================================
// SECTION 2: STATE
// ============================================
let db;
let clients = [];
let ordersRA = [];
let ordersRD = [];
let ordersFusion = [];
let projects = [];
let goStatus = [];
let legacyOrders = [];
let clientSort = { field:'dp', dir:1 };
let currentOrderTab = 'ra';
let editingOrderType = null;
let orderFilters = { search: '', technician: '', project: '' };
let expandedProjects = new Set();
let lastNewWorksReport = null;

// ============================================
// SECTION 3: IndexedDB
// ============================================
function openDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open('WorkManagerDB', 3);
        req.onupgradeneeded = e => {
            const d = e.target.result;
            if (!d.objectStoreNames.contains('orders')) d.createObjectStore('orders', { keyPath:'id', autoIncrement:true });
            if (!d.objectStoreNames.contains('clients')) d.createObjectStore('clients', { keyPath:'id', autoIncrement:true });
            if (!d.objectStoreNames.contains('orders_ra')) d.createObjectStore('orders_ra', { keyPath:'id', autoIncrement:true });
            if (!d.objectStoreNames.contains('orders_rd')) d.createObjectStore('orders_rd', { keyPath:'id', autoIncrement:true });
            if (!d.objectStoreNames.contains('orders_fusion')) d.createObjectStore('orders_fusion', { keyPath:'id', autoIncrement:true });
            if (!d.objectStoreNames.contains('projects')) d.createObjectStore('projects', { keyPath:'id', autoIncrement:true });
            if (!d.objectStoreNames.contains('go_status')) d.createObjectStore('go_status', { keyPath:'id', autoIncrement:true });
        };
        req.onsuccess = e => { db = e.target.result; resolve(); };
        req.onerror = e => reject(e);
    });
}
function dbGetAll(store) {
    return new Promise(r => { const tx = db.transaction(store,'readonly'); tx.objectStore(store).getAll().onsuccess = e => r(e.target.result || []); });
}
function dbPut(store, obj) {
    return new Promise(r => { const tx = db.transaction(store,'readwrite'); const s = tx.objectStore(store); const req = obj.id ? s.put(obj) : s.add(obj); req.onsuccess = e => r(e.target.result); });
}
function dbClear(store) {
    return new Promise(r => { const tx = db.transaction(store,'readwrite'); tx.objectStore(store).clear().onsuccess = () => r(); });
}
function dbDelete(store, id) {
    return new Promise(r => { const tx = db.transaction(store,'readwrite'); tx.objectStore(store).delete(id).onsuccess = () => r(); });
}
async function loadAll() {
    clients = await dbGetAll('clients');
    ordersRA = await dbGetAll('orders_ra');
    ordersRD = await dbGetAll('orders_rd');
    ordersFusion = await dbGetAll('orders_fusion');
    projects = await dbGetAll('projects');
    goStatus = await dbGetAll('go_status');
    legacyOrders = await dbGetAll('orders');
}

// ============================================
// SECTION 4: TOAST
// ============================================
function toast(msg) {
    const el = document.getElementById('toast');
    document.getElementById('toast-msg').textContent = msg;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 3000);
}

// ============================================
// SECTION 5: CSV PARSING
// ============================================
function parseCSV(text) {
    const lines = [];
    let current = '', inQuote = false, row = [];
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (inQuote) {
            if (c === '"' && text[i+1] === '"') { current += '"'; i++; }
            else if (c === '"') { inQuote = false; }
            else { current += c; }
        } else {
            if (c === '"') { inQuote = true; }
            else if (c === ',') { row.push(current.trim()); current = ''; }
            else if (c === '\n' || (c === '\r' && text[i+1] === '\n')) {
                row.push(current.trim()); current = '';
                if (c === '\r') i++;
                if (row.some(x => x)) lines.push(row);
                row = [];
            } else { current += c; }
        }
    }
    row.push(current.trim());
    if (row.some(x => x)) lines.push(row);
    return lines;
}
function csvToObjects(lines) {
    if (lines.length < 2) return [];
    const headers = lines[0];
    return lines.slice(1).map(row => {
        const obj = {};
        headers.forEach((h, i) => obj[h] = row[i] || '');
        return obj;
    });
}

// ============================================
// SECTION 6: SMART IMPORT
// ============================================
function detectCSVType(headers) {
    const h = headers.join(',').toLowerCase().normalize('NFC');
    if (h.includes('auftragsnummer') && h.includes('anschlussstatus')) return 'clients';
    if (h.includes('tiefbau fertig') || h.includes('einblasen ap') || h.includes('kabelsorte') || h.includes('projekt- nummer')) return 'go_status';
    if (h.includes('codigo de proyecto') && h.includes('metros soplados') && !h.includes('ka cliente') && !h.includes('ka ') && !h.includes('calle') && !h.includes('fusiones')) return 'soplado_ra';
    // Also try with accent
    if (h.includes('c\u00f3digo de proyecto') && h.includes('metros soplados') && !h.includes('ka cliente') && !h.includes('ka ') && !h.includes('calle') && !h.includes('fusiones')) return 'soplado_ra';
    if (h.includes('fusiones') || (h.includes('c\u00f3digo de proyecto') && h.includes('registro fotografico')) || (h.includes('codigo de proyecto') && h.includes('registro fotografico'))) return 'fusion';
    if (h.includes('ka cliente') || h.includes('ka ') ||
        (h.includes('c\u00f3digo de proyecto') && (h.includes('calle') || h.includes('direcci\u00f3n')) && h.includes('metros')) ||
        (h.includes('codigo de proyecto') && (h.includes('calle') || h.includes('direccion')) && h.includes('metros'))) {
        return 'soplado_rd';
    }
    return null;
}

function getFieldValue(obj, fieldNames) {
    for (const name of fieldNames) {
        if (obj[name]) return obj[name];
    }
    return '';
}

function normalizeDP(raw) {
    if (!raw) return '';
    const str = raw.toString().trim().toUpperCase();
    if (/^\d+$/.test(str)) return 'DP' + str.padStart(3, '0');
    const m = str.match(/DP[- ]?(\d+)/);
    if (m) return 'DP' + m[1].padStart(3, '0');
    return raw.trim();
}

function extractProjectCode(row) {
    const dp = row['DP'] || '';
    const m = dp.match(/(QFF-\d+)/i);
    return m ? m[1].toUpperCase() : '';
}

function extractProjectCodeFromDP(dpStr) {
    const m = (dpStr || '').match(/(QFF-\d+)/i);
    return m ? m[1].toUpperCase() : '';
}

// ============================================
// ADDRESS MATCHING (fuzzy)
// ============================================
function normalizeAddr(s) {
    if (!s) return '';
    return s.toLowerCase()
        .replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/ß/g,'ss')
        .replace(/á/g,'a').replace(/é/g,'e').replace(/í/g,'i').replace(/ó/g,'o').replace(/ú/g,'u')
        .replace(/ñ/g,'n')
        .replace(/stra(ss|ß)e/g,'str').replace(/str\./g,'str')
        .replace(/[^a-z0-9]/g,' ')
        .replace(/\s+/g,' ').trim();
}

function levenshtein(a, b) {
    if (a === b) return 0;
    const la = a.length, lb = b.length;
    if (!la) return lb;
    if (!lb) return la;
    let prev = Array.from({length: lb + 1}, (_, i) => i);
    for (let i = 1; i <= la; i++) {
        let curr = [i];
        for (let j = 1; j <= lb; j++) {
            curr[j] = a[i-1] === b[j-1] ? prev[j-1] : 1 + Math.min(prev[j-1], prev[j], curr[j-1]);
        }
        prev = curr;
    }
    return prev[lb];
}

function addrSimilarity(a, b) {
    const na = normalizeAddr(a), nb = normalizeAddr(b);
    if (na === nb) return 1;
    if (!na || !nb) return 0;
    const maxLen = Math.max(na.length, nb.length);
    return 1 - levenshtein(na, nb) / maxLen;
}

function composeClientAddr(c) {
    let addr = (c.street || '').trim();
    if (c.hausnummer) addr += ' ' + c.hausnummer.trim();
    if (c.hausnummerZusatz) addr += ' ' + c.hausnummerZusatz.trim();
    return addr;
}

function matchClientForRD(projCode, dp, rdStreet) {
    // Filter clients by project and DP
    const candidates = clients.filter(c => c.projectCode === projCode && c.dp === dp);
    if (!candidates.length) return { client: null, score: 0, status: 'no_clients' };

    let bestClient = null, bestScore = 0;
    for (const c of candidates) {
        const clientAddr = composeClientAddr(c);
        const score = addrSimilarity(rdStreet, clientAddr);
        if (score > bestScore) { bestScore = score; bestClient = c; }
    }

    if (bestScore >= 0.85) return { client: bestClient, score: bestScore, status: 'match' };
    if (bestScore >= 0.5) return { client: bestClient, score: bestScore, status: 'partial' };
    return { client: bestClient, score: bestScore, status: 'mismatch' };
}

function showImportReport(type, newOrders, duplicates, missing) {
    const typeNames = { soplado_ra: 'Soplado RA', soplado_rd: 'Soplado RD', fusion: 'Fusion' };
    const title = t('resultadoImport') + ' - ' + (typeNames[type] || type);
    const total = newOrders.length + duplicates.length;

    let html = `<div class="report-summary">
        <fieldset><legend>Total CSV</legend><div class="rpt-val" style="color:#000080">${total}</div></fieldset>
        <fieldset><legend>${t('nuevas')}</legend><div class="rpt-val" style="color:#008000">${newOrders.length}</div></fieldset>
        <fieldset><legend>${t('yaExistia')}</legend><div class="rpt-val" style="color:#804000">${duplicates.length}</div></fieldset>
        <fieldset><legend>${t('faltan')}</legend><div class="rpt-val" style="color:#800000">${missing.length}</div></fieldset>
    </div>`;

    html += `<div class="report-section-title">${t('importadas')}: ${newOrders.length}</div>`;
    if (newOrders.length) {
        html += '<ul class="report-list">';
        newOrders.forEach(o => html += `<li>${o}</li>`);
        html += '</ul>';
    } else html += '<p style="color:#808080;font-size:11px;margin:2px 0 0 16px">--</p>';

    html += `<div class="report-section-title">${t('yaExistia')}: ${duplicates.length}</div>`;
    if (duplicates.length) {
        html += '<ul class="report-list">';
        duplicates.forEach(o => html += `<li>${o}</li>`);
        html += '</ul>';
    } else html += '<p style="color:#808080;font-size:11px;margin:2px 0 0 16px">--</p>';

    if (missing.length > 0) {
        html += `<div class="report-section-title">${t('faltan')} (${t('gereedEnGO')}): ${missing.length}</div>`;
        html += '<ul class="report-list">';
        missing.forEach(o => html += `<li>${o}</li>`);
        html += '</ul>';
    }

    const allOrders = type === 'soplado_ra' ? ordersRA : type === 'soplado_rd' ? ordersRD : ordersFusion;
    const withIncidents = allOrders.filter(o => o.incidents && o.incidents.trim() !== '');
    if (withIncidents.length > 0) {
        html += `<div class="report-section-title">Ordenes con incidencias: ${withIncidents.length}</div>`;
        html += '<ul class="report-list">';
        withIncidents.forEach(o => html += `<li><strong>${o.projectCode} ${o.dp || ''}</strong> (${o.technician}): ${o.incidents}</li>`);
        html += '</ul>';
    }

    WM.openDialog('importReport', title, html, 500, 400);
}

async function smartImport(input) {
    const files = input.files;
    if (!files.length) return;
    const statusEl = document.getElementById('smartImportStatus');
    const typeLabels = { clients:'Clientes GO', go_status:'GO Status (DPs)', soplado_ra:'Soplado RA', soplado_rd:'Soplado RD', fusion:'Fusion' };
    let results = [];
    for (const file of files) {
        if (statusEl) statusEl.innerHTML = `<span class="upload-status processing">Procesando ${file.name}...</span>`;
        try {
            const text = await file.text();
            const lines = parseCSV(text);
            if (lines.length < 2) { results.push(`${file.name}: archivo vacio`); continue; }
            const type = detectCSVType(lines[0]);
            if (!type) { results.push(`${file.name}: formato no reconocido`); toast('No reconocido: ' + file.name); continue; }
            const objs = csvToObjects(lines);
            switch(type) {
                case 'clients': await importClients(objs); break;
                case 'soplado_ra': await importRA(objs); break;
                case 'soplado_rd': await importRD(objs); break;
                case 'fusion': await importFusion(objs); break;
                case 'go_status': await importGoStatus(objs); break;
            }
            results.push(`${file.name}: ${typeLabels[type]} (${objs.length} registros)`);
        } catch (err) {
            results.push(`${file.name}: Error - ${err.message}`);
        }
    }
    await loadAll();
    renderOpenWindows();
    // Re-grab statusEl since DOM was re-rendered
    const newStatusEl = document.getElementById('smartImportStatus');
    if (newStatusEl) {
        newStatusEl.innerHTML = results.map(r => `<div class="upload-status success">${r}</div>`).join('');
        setTimeout(() => { if (newStatusEl) newStatusEl.innerHTML = ''; }, 8000);
    }
    input.value = '';
}

async function handleCSVUpload(input, type) {
    const file = input.files[0];
    if (!file) return;
    const statusEl = document.getElementById('status' + type.toUpperCase());
    if (statusEl) { statusEl.className = 'upload-status processing'; statusEl.textContent = 'Procesando archivo...'; }
    try {
        const text = await file.text();
        const lines = parseCSV(text);
        if (lines.length < 2) throw new Error('Archivo vacio o sin datos');
        const objs = csvToObjects(lines);
        switch(type) {
            case 'ra': await importRA(objs); break;
            case 'rd': await importRD(objs); break;
            case 'fusion': await importFusion(objs); break;
        }
        await loadAll();
        orderFilters = { search: '', technician: '', project: '' };
        renderOpenWindows();
        if (statusEl) { statusEl.className = 'upload-status success'; statusEl.textContent = objs.length + ' ordenes procesadas'; setTimeout(() => { statusEl.textContent = ''; }, 5000); }
    } catch (error) {
        console.error('Upload error:', error);
        if (statusEl) { statusEl.className = 'upload-status error'; statusEl.textContent = 'Error: ' + error.message; setTimeout(() => { statusEl.textContent = ''; }, 8000); }
    }
    input.value = '';
}

async function importClients(objs) {
    // MERGE import: update existing by auftrag key, add new, never delete
    const existingByAuftrag = {};
    clients.forEach(c => { if (c.auftrag) existingByAuftrag[c.auftrag] = c; });

    let added = 0, updated = 0, skipped = 0;
    const projectMap = {};

    // First, build project map from existing data
    clients.forEach(c => {
        if (c.projectCode) {
            if (!projectMap[c.projectCode]) projectMap[c.projectCode] = { code: c.projectCode, projektnummer: c.projektnummer, dps: new Set() };
            projectMap[c.projectCode].dps.add(c.dp);
        }
    });

    for (const o of objs) {
        const dpFull = o['DP'] || '';
        const projCode = extractProjectCode(o);
        const dpNorm = normalizeDP(dpFull);
        const grundNA = (o['GrundNA'] || '').trim();
        // Contract: R0 = cliente, others = no-cliente / pre-contract
        let contract = '';
        if (['R0','R1','R18','R20'].includes(grundNA)) contract = grundNA;
        // ANSCHLUSSSTATUS is numeric (0,100,101,102,103,108,109) or 'Fertig'
        const anschluss = (o['ANSCHLUSSSTATUS'] || '').toString().trim();
        const validStatuses = ['0','100','101','102','103','108','109','Fertig'];
        const status = validStatuses.includes(anschluss) ? anschluss : '0';
        const phase = (o['Status'] || '').trim();
        const auftrag = o['Auftragsnummer'] || '';

        const clientData = {
            auftrag: auftrag, projektnummer: o['Projektnummer'] || '',
            projectCode: projCode, dp: dpNorm, dpFull: dpFull,
            street: o['Stra\u00dfe'] || o['Strasse'] || '', hausnummer: o['Hausnummer'] || '',
            hausnummerZusatz: o['Hausnummernzusatz'] || '', unit: o['Unit'] || '',
            cableId: o['Cable ID (From TRI)'] || '', contract: contract,
            status: status, phase: phase, farbeRohre: o['Farbe Rohre'] || '',
            datumHausanschluss: o['Datum Hausanschluss'] || '',
            trenchIP: o['Trench-IP-fiber'] || '', trenchTV: o['Trench-TV-fiber'] || '', hasTV: o['HAS-TV-fiber'] || '',
            isClient: contract === 'R0',
        };

        // Merge: if auftrag exists, update; otherwise add new
        const existing = auftrag ? existingByAuftrag[auftrag] : null;
        if (existing) {
            clientData.id = existing.id; // keep same DB id
            await dbPut('clients', clientData);
            updated++;
        } else {
            await dbPut('clients', clientData);
            added++;
        }

        // Build project map (additive)
        if (projCode) {
            if (!projectMap[projCode]) projectMap[projCode] = { code: projCode, projektnummer: clientData.projektnummer, dps: new Set() };
            projectMap[projCode].dps.add(dpNorm);
        }
    }

    // Reload projects from DB to get fresh state (may have been updated by GO import)
    projects = await dbGetAll('projects');

    // Update projects: merge, don't replace
    const existingProjects = {};
    projects.forEach(p => { if (p.code) existingProjects[p.code] = p; });

    // Detect all unique projects in this import
    const importedProjects = new Set();
    for (const [code, data] of Object.entries(projectMap)) {
        importedProjects.add(code);
        const existing = existingProjects[code];
        if (existing) {
            existing.dpCount = data.dps.size;
            existing.projektnummer = data.projektnummer;
            await dbPut('projects', existing);
        } else {
            await dbPut('projects', { code, projektnummer: data.projektnummer, dpCount: data.dps.size });
        }
    }

    await loadAll();
    const totalR0 = objs.filter(o => (o['GrundNA'] || '').trim() === 'R0').length;
    const projList = [...importedProjects].join(', ');
    toast(added + ' nuevos, ' + updated + ' actualizados | ' + totalR0 + ' R0 | Proyectos: ' + projList);
}

async function importRA(objs) {
    const newOrders = [], duplicates = [];
    const existingSet = new Set(ordersRA.map(o => `${o.projectCode}|${o.timestamp}`));
    for (const o of objs) {
        const projCode = getFieldValue(o, ['C\u00f3digo de Proyecto', 'Codigo de Proyecto', 'Project Code', 'Proyecto']);
        const technician = getFieldValue(o, ['T\u00e9cnico Responsable', 'Tecnico Responsable', 'T\u00e9cnico', 'Tecnico', 'Technician']);
        const startDate = getFieldValue(o, ['Fecha de Inicio', 'Fecha Inicio', 'Start Date', 'Inicio']);
        const endDate = getFieldValue(o, ['Fecha de Finalizaci\u00f3n', 'Fecha Finalizacion', 'Fecha Final', 'End Date']);
        const fibers = getFieldValue(o, ['N\u00famero de Fibras', 'Numero de Fibras', 'Fibras', 'Fibers']);
        const meters = getFieldValue(o, ['Metros Soplados', 'Metros', 'meters', 'Longitud']);
        const color = getFieldValue(o, ['Color miniducto', 'Color', 'Miniducto Color']);
        const incidents = getFieldValue(o, ['Incidencias (si las hubo)', 'Incidencias', 'Incidents']);
        const photos = getFieldValue(o, ['Fotos del Trabajo', 'Fotos', 'Photos']);
        const timestamp = getFieldValue(o, ['Timestamp', 'timestamp', 'Marca temporal', 'Time']);
        const key = `${projCode}|${timestamp}`;
        if (existingSet.has(key)) { duplicates.push(`${projCode} (${technician}, ${meters}m)`); }
        else {
            newOrders.push(`${projCode} (${technician}, ${fibers} fibras, ${meters}m)`);
            existingSet.add(key);
            await dbPut('orders_ra', { timestamp, projectCode: projCode, technician, startDate, endDate, fibers, meters, color, incidents, photos });
        }
    }
    const missing = [];
    const raProjects = new Set([...ordersRA.map(o => o.projectCode), ...objs.map(o => getFieldValue(o, ['C\u00f3digo de Proyecto','Codigo de Proyecto']))]);
    goStatus.forEach(g => {
        if (g.einblasenAPDP?.toUpperCase().includes('GEREED')) {
            const projCode = g.projectCode || '';
            if (projCode && !raProjects.has(projCode)) missing.push(`${projCode} ${g.dp}`);
        }
    });
    toast(objs.length + ' Soplado RA ' + t('imported'));
    showImportReport('soplado_ra', newOrders, duplicates, [...new Set(missing)]);
}

async function importRD(objs) {
    const newOrders = [], duplicates = [];
    const newWorkItems = []; // For the new works window
    const existingSet = new Set(ordersRD.map(o => `${o.projectCode}|${o.dp}|${o.ka}`));

    // Build GO status lookup before import
    const goByProjDP = {};
    goStatus.forEach(g => { goByProjDP[(g.projectCode || '') + '|' + g.dp] = g; });

    for (const o of objs) {
        const dp = normalizeDP(getFieldValue(o, ['DP', 'dp', 'Distribution Point']));
        const projCode = getFieldValue(o, ['C\u00f3digo de Proyecto', 'Codigo de Proyecto', 'Project Code', 'Proyecto']);
        const ka = getFieldValue(o, ['KA cliente', 'KA Cliente', 'KA', 'ka cliente']);
        const street = getFieldValue(o, ['Calle', 'calle', 'Direcci\u00f3n', 'Direccion', 'Address']);
        const technician = getFieldValue(o, ['T\u00e9cnico Responsable', 'Tecnico Responsable', 'T\u00e9cnico', 'Tecnico', 'Technician']);
        const startDate = getFieldValue(o, ['Fecha de Inicio', 'Fecha Inicio']);
        const endDate = getFieldValue(o, ['Fecha de Finalizaci\u00f3n', 'Fecha Finalizacion', 'Fecha Final']);
        const meters = getFieldValue(o, ['Metros Soplados', 'Metros', 'meters']);
        const color = getFieldValue(o, ['Color miniducto', 'Color']);
        const incidents = getFieldValue(o, ['Incidencias (si las hubo)', 'Incidencias', 'Incidents']);
        const photos = getFieldValue(o, ['Fotos del Trabajo', 'Fotos', 'Photos']);
        const fibers = getFieldValue(o, ['N\u00famero de Fibras', 'Numero de Fibras', 'Fibras']);
        const timestamp = getFieldValue(o, ['Timestamp', 'timestamp', 'Marca temporal']);
        const key = `${projCode}|${dp}|${ka}`;

        // Check GO status for this DP
        const goKey = `${projCode}|${dp}`;
        const goEntry = goByProjDP[goKey];
        const goBlow = goEntry?.einblasenAPDP?.toUpperCase().includes('GEREED');
        const isNewInDB = !existingSet.has(key);

        if (existingSet.has(key)) { duplicates.push(`${projCode} ${dp} ${ka} (${street})`); }
        else {
            newOrders.push(`${projCode} ${dp} ${ka} (${technician}, ${meters}m)`);
            existingSet.add(key);
            await dbPut('orders_rd', { timestamp, projectCode: projCode, dp, street, ka, technician, startDate, endDate, meters, color, incidents, photos, fibers });
        }

        // Match client by address
        const match = matchClientForRD(projCode, dp, street);

        // Track for new works report
        newWorkItems.push({
            type: 'rd', projCode, dp, ka, street, technician, startDate, endDate, meters, color, fibers, incidents,
            isNewInDB,
            goBlow: !!goBlow,
            goNotFound: !goEntry,
            photos,
            matchStatus: match.status,
            matchScore: match.score,
            matchClient: match.client ? {
                auftrag: match.client.auftrag,
                addr: composeClientAddr(match.client),
                contract: match.client.contract,
                status: match.client.status,
                phase: match.client.phase,
            } : null,
        });
    }
    await loadAll();
    const rdDPSet = new Set(ordersRD.map(o => `${o.projectCode}|${o.dp}`));
    const missing = [];
    goStatus.forEach(g => {
        if (g.einblasenAPDP?.toUpperCase().includes('GEREED')) {
            const projCode = g.projectCode || '';
            if (projCode && !rdDPSet.has(`${projCode}|${g.dp}`)) missing.push(`${projCode} ${g.dp}`);
        }
    });
    await autoUpdateFromRD();
    toast(objs.length + ' Soplado RD ' + t('imported'));
    showImportReport('soplado_rd', newOrders, duplicates, [...new Set(missing)]);

    // Build and show new works report
    lastNewWorksReport = {
        type: 'rd',
        timestamp: new Date().toLocaleString(),
        items: newWorkItems,
        projects: [...new Set(newWorkItems.map(i => i.projCode).filter(Boolean))],
    };
    if (WM.windows.has('newworks')) WM.close('newworks');
    WM.open('newworks');
}

async function importFusion(objs) {
    const newOrders = [], duplicates = [];
    const newWorkItems = []; // For the new works window
    const existingSet = new Set(ordersFusion.map(o => `${o.projectCode}|${o.dp}`));

    // Build GO status lookup before import
    const goByProjDP = {};
    goStatus.forEach(g => { goByProjDP[(g.projectCode || '') + '|' + g.dp] = g; });

    for (const o of objs) {
        const dp = normalizeDP(getFieldValue(o, ['DP', 'dp', 'Distribution Point']));
        const projCode = getFieldValue(o, ['C\u00f3digo de Proyecto', 'Codigo de Proyecto', 'Project Code', 'Proyecto']);
        const technician = getFieldValue(o, ['T\u00e9cnico Responsable', 'Tecnico Responsable', 'T\u00e9cnico', 'Tecnico', 'Technician']);
        const startDate = getFieldValue(o, ['Fecha de Inicio', 'Fecha Inicio']);
        const endDate = getFieldValue(o, ['Fecha de Finalizaci\u00f3n', 'Fecha Finalizacion', 'Fecha Final']);
        const splices = getFieldValue(o, ['Fusiones realizadas', 'Fusiones', 'Splices']);
        const incidents = getFieldValue(o, ['Incidencias (si las hubo)', 'Incidencias', 'Incidents']);
        const photos = getFieldValue(o, ['Fotos del Trabajo', 'Fotos', 'Photos']);
        const photoRegistry = getFieldValue(o, ['Registro Fotografico', 'Registro Fotogr\u00e1fico']);
        const timestamp = getFieldValue(o, ['Timestamp', 'timestamp', 'Marca temporal']);
        const key = `${projCode}|${dp}`;

        // Check GO status for this DP
        const goEntry = goByProjDP[key];
        const goSpliceAP = goEntry?.spleissenAP?.toUpperCase().includes('GEREED');
        const goSpliceDP = goEntry?.spleisseDPbereit?.toUpperCase().includes('GEREED');
        const isNewInDB = !existingSet.has(key);

        if (existingSet.has(key)) { duplicates.push(`${projCode} ${dp} (${technician})`); }
        else {
            newOrders.push(`${projCode} ${dp} (${technician}, ${splices} fusiones)`);
            existingSet.add(key);
            await dbPut('orders_fusion', { timestamp, projectCode: projCode, dp, technician, startDate, endDate, splices, incidents, photos, photoRegistry });
        }

        // Track for new works report
        newWorkItems.push({
            type: 'fusion', projCode, dp, technician, startDate, endDate, splices, incidents,
            isNewInDB,
            goSpliceAP: !!goSpliceAP,
            goSpliceDP: !!goSpliceDP,
            goNotFound: !goEntry,
            photos, photoRegistry,
        });
    }
    await loadAll();
    const fusionDPSet = new Set(ordersFusion.map(o => `${o.projectCode}|${o.dp}`));
    const missing = [];
    goStatus.forEach(g => {
        if (g.spleissenAP?.toUpperCase().includes('GEREED') || g.spleisseDPbereit?.toUpperCase().includes('GEREED')) {
            const projCode = g.projectCode || '';
            if (projCode && !fusionDPSet.has(`${projCode}|${g.dp}`)) missing.push(`${projCode} ${g.dp}`);
        }
    });
    await autoUpdateFromFusion();
    toast(objs.length + ' Fusion ' + t('imported'));
    showImportReport('fusion', newOrders, duplicates, [...new Set(missing)]);

    // Build and show new works report
    lastNewWorksReport = {
        type: 'fusion',
        timestamp: new Date().toLocaleString(),
        items: newWorkItems,
        projects: [...new Set(newWorkItems.map(i => i.projCode).filter(Boolean))],
    };
    // Close and reopen to refresh
    if (WM.windows.has('newworks')) WM.close('newworks');
    WM.open('newworks');
}

async function importGoStatus(objs) {
    // MERGE: upsert by projectCode+dp key, don't clear other projects
    const existingByKey = {};
    goStatus.forEach(g => { const k = (g.projectCode || '') + '|' + g.dp; existingByKey[k] = g; });

    let added = 0, updated = 0;
    const goProjectMap = {};
    for (const o of objs) {
        const keys = Object.keys(o);
        const projKey = keys.find(k => k.toLowerCase().includes('projekt') && k.toLowerCase().includes('nummer')) || keys[0];
        const dpFull = o['DP'] || '';
        const projectCode = extractProjectCodeFromDP(dpFull);
        const dp = normalizeDP(dpFull);
        const entry = {
            projektnummer: o[projKey] || '', projekt: o['Projekt'] || '',
            projectCode, dp, dpFull,
            startTiefbau: o['Start Tiefbau'] || '', endeTiefbau: o['Ende Tiefbau'] || '',
            tiefbauFertig: (o[keys.find(k => k.toLowerCase().includes('tiefbau fertig'))] || '').toString(),
            kabelsorte: o['Kabelsorte'] || '',
            einblasenAPDP: o[keys.find(k => k.toLowerCase().includes('einblasen'))] || '',
            spleissenAP: o[keys.find(k => k.toLowerCase().includes('splei\u00dfen ap') || k.toLowerCase().includes('spleissen ap'))] || '',
            spleisseDPbereit: o[keys.find(k => k.toLowerCase().includes('splei\u00dfe dp') || k.toLowerCase().includes('spleisse dp'))] || '',
        };
        const lookupKey = projectCode + '|' + dp;
        const existing = existingByKey[lookupKey];
        if (existing) {
            entry.id = existing.id;
            updated++;
        } else {
            added++;
        }
        await dbPut('go_status', entry);
        // Track projects from GO status
        if (projectCode) {
            if (!goProjectMap[projectCode]) goProjectMap[projectCode] = { code: projectCode, projektnummer: entry.projektnummer, projekt: entry.projekt, dps: new Set() };
            goProjectMap[projectCode].dps.add(dp);
        }
    }
    // Create/update projects from GO status data
    const existingProjects = {};
    projects.forEach(p => { if (p.code) existingProjects[p.code] = p; });
    for (const [code, data] of Object.entries(goProjectMap)) {
        const existing = existingProjects[code];
        if (existing) {
            // Merge: update dpCount if GO has more DPs
            const goDPCount = data.dps.size;
            if (goDPCount > (existing.dpCount || 0)) existing.dpCount = goDPCount;
            if (!existing.projekt) existing.projekt = data.projekt;
            await dbPut('projects', existing);
        } else {
            await dbPut('projects', { code, projektnummer: data.projektnummer, projekt: data.projekt, dpCount: data.dps.size });
        }
    }
    await loadAll();
    toast(added + ' nuevos, ' + updated + ' actualizados | GO: ' + Object.keys(goProjectMap).join(', '));
}

async function autoUpdateFromRD() {
    for (const rd of ordersRD) {
        const matching = clients.filter(c => c.projectCode === rd.projectCode && c.dp === rd.dp && c.cableId && c.cableId.includes(rd.ka));
        for (const c of matching) {
            if (c.status === '108') continue;
            if (c.status === '109') {
                const raExists = ordersRA.some(ra => ra.projectCode === rd.projectCode);
                if (raExists) { c.status = '103'; c.phase = 'Splei\u00dfe'; await dbPut('clients', c); }
            }
        }
    }
}

async function autoUpdateFromFusion() {
    for (const f of ordersFusion) {
        const matching = clients.filter(c => c.projectCode === f.projectCode && c.dp === f.dp);
        for (const c of matching) {
            if (c.status === '108') continue;
            if (['109','0'].includes(c.status)) { c.phase = 'Splei\u00dfe'; await dbPut('clients', c); }
        }
    }
}

// ============================================
// SECTION 7: WINDOW MANAGER
// ============================================
const WM = {
    windows: new Map(),
    zCounter: 100,
    cascadeOffset: 0,

    open(id) {
        let info = this.windows.get(id);
        if (!info) {
            const el = this._create(id);
            if (!el) return;
            info = { el, minimized: false, maximized: false };
            this.windows.set(id, info);
            this._renderContent(id);
        }
        info.minimized = false;
        info.el.classList.add('visible');
        this.focus(id);
        this.updateTaskbar();
    },

    close(id) {
        const info = this.windows.get(id);
        if (!info) return;
        info.el.classList.remove('visible');
        info.el.remove();
        this.windows.delete(id);
        this.updateTaskbar();
    },

    minimize(id) {
        const info = this.windows.get(id);
        if (!info) return;
        info.minimized = true;
        info.el.classList.remove('visible');
        this.updateTaskbar();
    },

    maximize(id) {
        const info = this.windows.get(id);
        if (!info) return;
        info.maximized = !info.maximized;
        info.el.classList.toggle('maximized', info.maximized);
    },

    focus(id) {
        const info = this.windows.get(id);
        if (!info) return;
        this.zCounter++;
        info.el.style.zIndex = this.zCounter;
        // Mark active/inactive title bars
        this.windows.forEach((w, wid) => {
            const tb = w.el.querySelector('.title-bar');
            if (wid === id) tb.classList.remove('inactive');
            else tb.classList.add('inactive');
        });
        this.updateTaskbar();
    },

    updateTaskbar() {
        const container = document.getElementById('taskbar-windows');
        container.innerHTML = '';
        this.windows.forEach((info, id) => {
            const btn = document.createElement('button');
            btn.textContent = info.el.querySelector('.title-bar-text').textContent;
            const isActive = !info.minimized && !info.el.querySelector('.title-bar.inactive');
            if (isActive) btn.classList.add('active');
            btn.onclick = () => {
                if (info.minimized) { info.minimized = false; info.el.classList.add('visible'); this.focus(id); }
                else if (!info.el.querySelector('.title-bar.inactive')) { this.minimize(id); }
                else { this.focus(id); }
            };
            container.appendChild(btn);
        });
    },

    makeDraggable(id) {
        const info = this.windows.get(id);
        if (!info) return;
        const el = info.el;
        const titleBar = el.querySelector('.title-bar');
        let isDragging = false, startX, startY, origX, origY;

        titleBar.addEventListener('mousedown', (e) => {
            if (e.target.tagName === 'BUTTON') return;
            if (info.maximized) return;
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            origX = el.offsetLeft;
            origY = el.offsetTop;
            this.focus(id);
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            el.style.left = (origX + e.clientX - startX) + 'px';
            el.style.top = (origY + e.clientY - startY) + 'px';
        });

        document.addEventListener('mouseup', () => { isDragging = false; });

        // Double-click title bar = toggle maximize
        titleBar.addEventListener('dblclick', (e) => {
            if (e.target.tagName === 'BUTTON') return;
            this.maximize(id);
        });

        // Click anywhere on window = focus
        el.addEventListener('mousedown', () => { this.focus(id); });
    },

    _create(id) {
        const titles = {
            dashboard: t('winDashboard'), clients: t('winClients'), orders: t('winOrders'),
            projects: t('winProjects'), invoicing: t('winInvoicing'), prices: t('winPrices'),
            about: t('winAbout'), newworks: 'Registro de Nuevos Trabajos',
        };
        const sizes = {
            dashboard: [750, 550], clients: [700, 500], orders: [750, 520],
            projects: [700, 500], invoicing: [650, 450], prices: [700, 450],
            about: [360, 260], newworks: [960, 540],
        };
        const title = titles[id] || id;
        const [w, h] = sizes[id] || [600, 400];

        // Cascade position
        const offset = (this.cascadeOffset % 8) * 30;
        this.cascadeOffset++;
        const left = 20 + offset;
        const top = 10 + offset;

        const win = document.createElement('div');
        win.className = 'window visible';
        win.id = 'win-' + id;
        win.style.cssText = `left:${left}px;top:${top}px;width:${w}px;height:${h}px;`;

        win.innerHTML = `
            <div class="title-bar">
                <div class="title-bar-text">${title}</div>
                <div class="title-bar-controls">
                    <button aria-label="Minimize" onclick="WM.minimize('${id}')"></button>
                    <button aria-label="Maximize" onclick="WM.maximize('${id}')"></button>
                    <button aria-label="Close" onclick="WM.close('${id}')"></button>
                </div>
            </div>
            <div class="window-body" id="winbody-${id}"></div>
            <div class="status-bar">
                <p class="status-bar-field" id="winstatus-${id}">Ready</p>
            </div>
        `;

        document.getElementById('desktop').appendChild(win);
        this.makeDraggable(id);
        return win;
    },

    _renderContent(id) {
        const body = document.getElementById('winbody-' + id);
        if (!body) return;
        body.innerHTML = getWindowScaffold(id);
        // Now populate with data
        switch(id) {
            case 'dashboard': renderDashboard(); break;
            case 'clients': renderClients(); break;
            case 'orders': renderOrders(); break;
            case 'projects': renderProjects(); break;
            case 'invoicing': renderInvoicing(); break;
            case 'prices': renderPrices(); break;
            case 'about': break; // static content
            case 'newworks': renderNewWorks(); break;
        }
    },

    openDialog(id, title, contentHTML, w, h) {
        // Close existing dialog of same id
        const existing = document.getElementById('win-dlg-' + id);
        if (existing) existing.remove();

        const win = document.createElement('div');
        win.className = 'window visible';
        win.id = 'win-dlg-' + id;
        const left = Math.max(40, (window.innerWidth - w) / 2);
        const top = Math.max(20, (window.innerHeight - h) / 2 - 40);
        win.style.cssText = `left:${left}px;top:${top}px;width:${w}px;height:${h}px;z-index:${++this.zCounter};`;
        win.innerHTML = `
            <div class="title-bar">
                <div class="title-bar-text">${title}</div>
                <div class="title-bar-controls">
                    <button aria-label="Close" onclick="this.closest('.window').remove()"></button>
                </div>
            </div>
            <div class="window-body" style="overflow:auto">${contentHTML}</div>
        `;
        document.getElementById('desktop').appendChild(win);
    }
};

// ============================================
// SECTION 8: WINDOW SCAFFOLDS (HTML templates)
// ============================================
function getWindowScaffold(id) {
    switch(id) {
        case 'dashboard': return getDashboardScaffold();
        case 'clients': return getClientsScaffold();
        case 'orders': return getOrdersScaffold();
        case 'projects': return getProjectsScaffold();
        case 'invoicing': return getInvoicingScaffold();
        case 'prices': return getPricesScaffold();
        case 'about': return getAboutScaffold();
        case 'newworks': return getNewWorksScaffold();
        default: return '<p>Unknown module</p>';
    }
}

function getDashboardScaffold() {
    return `
    <div class="kpi-grid">
        <fieldset style="cursor:pointer" onclick="WM.open('projects')" title="Ver Proyectos"><legend>${t('totalProjects')}</legend><div class="kpi-value" id="totalProjects">0</div><div class="kpi-trend" id="projectsTrend">--</div></fieldset>
        <fieldset><legend>${t('totalDPs')}</legend><div class="kpi-value" id="totalDPs">0</div><div class="kpi-trend" id="dpsTrend">--</div></fieldset>
        <fieldset><legend>Clientes (R0)</legend><div class="kpi-value" id="totalClientsR0" style="color:#000080">0</div><div class="kpi-trend" id="clientsR0Trend">--</div></fieldset>
        <fieldset><legend>Total Direcciones</legend><div class="kpi-value" id="totalClients">0</div><div class="kpi-trend" id="clientsTrend">--</div></fieldset>
        <fieldset><legend>Revision Pendiente</legend><div class="kpi-value" id="pendingReview" style="color:#800000">0</div></fieldset>
        <fieldset><legend>Discrepancias GO</legend><div class="kpi-value" id="goDiscrepancies" style="color:#804000">0</div></fieldset>
        <fieldset><legend>Listo Cert.</legend><div class="kpi-value" id="readyToCertify" style="color:#008000">0</div></fieldset>
    </div>
    <fieldset><legend>Resumen por Status (Clientes R0)</legend><div class="status-grid-98" id="clientStatusSummary"></div></fieldset>
    <fieldset><legend>Alertas</legend><div id="adminAlerts" style="font-size:11px">Sin alertas</div></fieldset>
    <fieldset style="margin-top:8px"><legend>Acciones Rapidas</legend>
        <div class="quick-actions">
            <button onclick="showPendingReview()">Revision Pendiente</button>
            <button onclick="showGODiscrepancies()">GO Sync</button>
            <button onclick="qualityCheck()">Quality Check</button>
            <button onclick="exportData()">Exportar</button>
        </div>
    </fieldset>
    <fieldset style="margin-top:8px"><legend>Importar CSV - GO FiberConnect</legend>
        <div style="font-size:11px;margin-bottom:6px">
            Importa directamente los exports de GO FiberConnect.<br>
            Detecta automaticamente: <strong>Clientes</strong>, <strong>GO Status (DPs)</strong>, <strong>Soplado RA</strong>, <strong>Soplado RD</strong>, <strong>Fusion</strong>
        </div>
        <div class="upload-zone-98" id="smartUploadZone">
            Arrastra archivos CSV aqui o selecciona (uno o varios):<br>
            <input type="file" accept=".csv" multiple onchange="smartImport(this)">
            <div id="smartImportStatus" style="margin-top:4px"></div>
        </div>
    </fieldset>
    <fieldset style="margin-top:8px"><legend>Status Overview</legend><div class="status-grid-98" id="statusOverview"></div></fieldset>
    <fieldset style="margin-top:8px"><legend>Productividad Tecnicos</legend><div class="tech-grid-98" id="productivityGrid"></div></fieldset>
    <fieldset style="margin-top:8px"><legend>Actividad Reciente</legend><div id="activityFeed" style="max-height:150px;overflow-y:auto"></div></fieldset>
    `;
}

function getClientsScaffold() {
    return `
    <div class="filter-bar">
        <input type="text" id="clientSearch" placeholder="Buscar..." oninput="renderClients()">
        <select id="clientFilterProject" onchange="renderClients()"><option value="">Todos Proy.</option></select>
        <select id="clientFilterDP" onchange="renderClients()"><option value="">Todos DP</option></select>
        <select id="clientFilterStatus" onchange="renderClients()">
            <option value="">Todos Status</option>
            <option value="0">0</option>
            <option value="100">100</option><option value="101">101</option>
            <option value="102">102</option><option value="103">103</option>
            <option value="108">108</option><option value="109">109</option>
            <option value="Fertig">Fertig</option>
        </select>
        <select id="clientFilterContract" onchange="renderClients()">
            <option value="">Todos</option>
            <option value="R0">R0 (Clientes)</option>
            <option value="noR0">No-Clientes</option>
            <option value="R1">R1</option>
            <option value="R18">R18</option>
            <option value="R20">R20</option>
            <option value="none">Sin contrato</option>
        </select>
        <button onclick="exportData()">Exportar</button>
    </div>
    <div class="sunken-panel" style="max-height:calc(100% - 60px);overflow:auto">
        <table>
            <thead><tr>
                <th onclick="sortClients('auftrag')">Auftrag</th>
                <th onclick="sortClients('dp')">DP</th>
                <th onclick="sortClients('street')">Direccion</th>
                <th onclick="sortClients('cableId')">Cable ID</th>
                <th onclick="sortClients('contract')">Tipo</th>
                <th onclick="sortClients('status')">Status</th>
                <th onclick="sortClients('phase')">Phase</th>
            </tr></thead>
            <tbody id="clientsBody"></tbody>
        </table>
    </div>
    <div id="clientCount" style="font-size:10px;margin-top:4px;color:#808080">0 clientes</div>
    `;
}

function getOrdersScaffold() {
    return `
    <div class="filter-bar">
        <input type="text" id="orderSearch" placeholder="Buscar..." oninput="applyOrderFilters()">
        <select id="filterTechnician" onchange="applyOrderFilters()"><option value="">Todos Tecnicos</option></select>
        <select id="filterProject" onchange="applyOrderFilters()"><option value="">Todos Proyectos</option></select>
    </div>
    <div class="win-tabs">
        <menu role="tablist">
            <li role="tab" aria-selected="true" onclick="switchOrderTab('ra')"><a href="#tab-ra">${t('ordersRA')}</a></li>
            <li role="tab" onclick="switchOrderTab('rd')"><a href="#tab-rd">${t('ordersRD')}</a></li>
            <li role="tab" onclick="switchOrderTab('fusion')"><a href="#tab-fusion">${t('ordersFusion')}</a></li>
        </menu>
        <div class="win-tab-content active" id="tab-ra">
            <div class="action-bar">
                <button onclick="openOrderModal('ra')">+ Agregar RA</button>
                <button onclick="cleanRARecords()">Limpiar RA</button>
            </div>
            <div class="upload-zone-98"><input type="file" accept=".csv" onchange="handleCSVUpload(this,'ra')"> <span id="statusRA" class="upload-status"></span></div>
            <div class="sunken-panel" style="max-height:280px;overflow:auto"><table>
                <thead><tr><th>Fecha</th><th>Proyecto</th><th>DP</th><th>Tecnico</th><th>Fibras</th><th>Metros</th><th>Color</th><th>Incidencias</th><th></th></tr></thead>
                <tbody id="raBody"></tbody>
            </table></div>
        </div>
        <div class="win-tab-content" id="tab-rd">
            <div class="action-bar">
                <button onclick="openOrderModal('rd')">+ Agregar RD</button>
                <button onclick="cleanRDRecords()">Limpiar RD</button>
            </div>
            <div class="upload-zone-98"><input type="file" accept=".csv" onchange="handleCSVUpload(this,'rd')"> <span id="statusRD" class="upload-status"></span></div>
            <div class="sunken-panel" style="max-height:280px;overflow:auto"><table>
                <thead><tr><th>Fecha</th><th>Proyecto</th><th>DP</th><th>Calle</th><th>KA</th><th>Tecnico</th><th>Metros</th><th>Color</th><th>Fibras</th><th></th></tr></thead>
                <tbody id="rdBody"></tbody>
            </table></div>
        </div>
        <div class="win-tab-content" id="tab-fusion">
            <div class="action-bar">
                <button onclick="openOrderModal('fusion')">+ Agregar Fusion</button>
                <button onclick="cleanFusionRecords()">Limpiar Fusion</button>
            </div>
            <div class="upload-zone-98"><input type="file" accept=".csv" onchange="handleCSVUpload(this,'fusion')"> <span id="statusFUSION" class="upload-status"></span></div>
            <div class="sunken-panel" style="max-height:280px;overflow:auto"><table>
                <thead><tr><th>Fecha</th><th>Proyecto</th><th>DP</th><th>Tecnico</th><th>Fusiones</th><th>Incidencias</th><th></th></tr></thead>
                <tbody id="fusionBody"></tbody>
            </table></div>
        </div>
    </div>
    `;
}

function getProjectsScaffold() {
    return `<div class="project-grid-98" id="projectsGrid"></div>`;
}

function getInvoicingScaffold() {
    return `
    <div class="invoice-totals-98" id="invoiceTotals"></div>
    <div class="sunken-panel" style="max-height:calc(100% - 100px);overflow:auto">
        <table>
            <thead><tr>
                <th><input type="checkbox" onchange="toggleAllInv(this)"></th>
                <th>Proyecto</th><th>Direccion</th><th>Unidades</th><th>Estado</th><th>Fecha Cert.</th>
            </tr></thead>
            <tbody id="invoiceBody"></tbody>
        </table>
    </div>
    <div class="action-bar" style="margin-top:8px">
        <button id="markInvoicedBtn" style="display:none" onclick="markInvoiced()">${t('markInvoiced')}</button>
    </div>
    `;
}

function getPricesScaffold() {
    return `
    <div class="kpi-grid" style="margin-bottom:8px">
        <fieldset><legend>${t('totalItems')}</legend><div class="kpi-value" id="priceTotalItems">0</div></fieldset>
        <fieldset><legend>${t('avgMargin')}</legend><div class="kpi-value" id="priceAvgMargin">-</div></fieldset>
    </div>
    <div class="sunken-panel" style="max-height:calc(100% - 80px);overflow:auto">
        <table>
            <thead><tr>
                <th>${t('thCode')}</th><th>${t('thDescription')}</th><th>${t('thUnit')}</th>
                <th>${t('thSalePrice')}</th><th>${t('thCostPrice')}</th>
                <th>${t('thMarginEur')}</th><th>${t('thMarginPct')}</th>
            </tr></thead>
            <tbody id="pricesBody"></tbody>
        </table>
    </div>
    `;
}

function getAboutScaffold() {
    return `
    <div style="text-align:center;padding:16px">
        <p style="font-size:16px;font-weight:bold">Work Manager 98</p>
        <p style="font-size:11px;color:#808080">Umtelkomd GmbH</p>
        <hr>
        <p style="font-size:11px">Version 2.0</p>
        <p style="font-size:11px">Fiber-optic network construction management</p>
        <p style="font-size:10px;color:#808080;margin-top:12px">
            IndexedDB v3 | 7 stores<br>
            Smart CSV Import | ES/DE i18n<br>
            GO FiberConnect Integration
        </p>
        <hr>
        <button onclick="WM.close('about')">OK</button>
    </div>
    `;
}

// ============================================
// SECTION 9: RENDER FUNCTIONS
// ============================================
function renderOpenWindows() {
    WM.windows.forEach((info, id) => {
        if (!info.minimized) WM._renderContent(id);
    });
}

function renderDashboard() {
    try {
        const uniqueProjects = new Set([
            ...clients.map(c => c.projectCode).filter(Boolean),
            ...goStatus.map(g => g.projectCode).filter(Boolean)
        ]);
        const uniqueDPs = new Set([
            ...clients.map(c => c.projectCode ? c.projectCode + '|' + c.dp : '').filter(Boolean),
            ...goStatus.map(g => g.projectCode ? g.projectCode + '|' + g.dp : '').filter(Boolean)
        ]);
        const clientsR0 = clients.filter(c => c.contract === 'R0' || c.isClient);
        const nonClients = clients.filter(c => c.contract !== 'R0' && !c.isClient);

        const el = (id) => document.getElementById(id);
        if (el('totalProjects')) el('totalProjects').textContent = uniqueProjects.size;
        if (el('totalDPs')) el('totalDPs').textContent = uniqueDPs.size;
        if (el('totalClientsR0')) el('totalClientsR0').textContent = clientsR0.length;
        if (el('totalClients')) el('totalClients').textContent = clients.length;
        if (el('clientsR0Trend')) el('clientsR0Trend').textContent = nonClients.length + ' no-clientes';

        // Client status summary (R0 only)
        const statusSummaryEl = el('clientStatusSummary');
        if (statusSummaryEl) {
            const statusCounts = {};
            clientsR0.forEach(c => {
                const s = c.status || '0';
                statusCounts[s] = (statusCounts[s] || 0) + 1;
            });
            const statusLabels = { '0':'Sin progreso', '100':'Termin', '101':'101', '102':'Abliefern', '103':'Hausbegehung', '108':'Tiefbau', '109':'Einblasen', 'Fertig':'Fertig' };
            const statusColors = { '108':'#800000', '109':'#000080', '103':'#808000', '102':'#400080', '101':'#804000', '100':'#804000', '0':'#808080', 'Fertig':'#008000' };
            let summaryHtml = '';
            for (const s of ['0','100','101','102','103','108','109','Fertig']) {
                if (statusCounts[s]) {
                    summaryHtml += `<fieldset style="cursor:pointer" onclick="filterClientsByStatus('${s}')" title="Ver clientes R0 con status ${s}"><legend>${statusLabels[s]}</legend><div class="status-val-98" style="color:${statusColors[s]}">${statusCounts[s]}</div></fieldset>`;
                }
            }
            statusSummaryEl.innerHTML = summaryHtml || '<p style="font-size:11px;color:#808080">Importa clientes de GO FiberConnect</p>';
        }

        // Admin metrics
        const withIncidents = [...ordersRA, ...ordersRD, ...ordersFusion].filter(o => o.incidents && o.incidents.trim() !== '');
        const goDiscrepancies = calculateGODiscrepancies();
        const dpsFused = new Set(ordersFusion.map(o => o.dp).filter(Boolean));
        const dpsBlown = new Set(ordersRD.map(o => o.dp).filter(Boolean));
        const readyToCertify = [...dpsFused].filter(dp => dpsBlown.has(dp)).length;

        if (el('pendingReview')) el('pendingReview').textContent = withIncidents.length;
        if (el('goDiscrepancies')) el('goDiscrepancies').textContent = goDiscrepancies.length;
        if (el('readyToCertify')) el('readyToCertify').textContent = readyToCertify;

        if (el('projectsTrend')) el('projectsTrend').textContent = ordersRA.length + ' RA cargados';
        if (el('dpsTrend')) el('dpsTrend').textContent = ordersRD.length + ' RD + ' + ordersFusion.length + ' Fusion';
        if (el('clientsTrend')) el('clientsTrend').textContent = goStatus.length + ' en GO';

        // Alerts
        renderAdminAlerts();
        renderStatusOverview();
        renderProductivityGrid();
        renderActivityFeed();

        // Status bar
        const statusEl = document.getElementById('winstatus-dashboard');
        if (statusEl) statusEl.textContent = clientsR0.length + ' clientes R0 | ' + clients.length + ' total | ' + (ordersRA.length+ordersRD.length+ordersFusion.length) + ' ordenes | ' + goStatus.length + ' GO';
    } catch (error) {
        console.error('renderDashboard error:', error);
    }
}

function renderAdminAlerts() {
    const alertsEl = document.getElementById('adminAlerts');
    if (!alertsEl) return;
    const alerts = [];
    const totalOrders = ordersRA.length + ordersRD.length + ordersFusion.length;
    if (totalOrders > 15) alerts.push('Advertencia: ' + totalOrders + ' ordenes pendientes de revision');
    const rdWithoutPhotos = ordersRD.filter(o => !o.photos || o.photos === '');
    if (rdWithoutPhotos.length > 0) alerts.push(rdWithoutPhotos.length + ' ordenes sin fotos verificadas');
    if (alerts.length === 0) { alertsEl.innerHTML = '<span style="color:#008000">Sin alertas</span>'; return; }
    alertsEl.innerHTML = alerts.map(a => `<div class="alert-item-98">${a}</div>`).join('');
}

function renderStatusOverview() {
    const overviewEl = document.getElementById('statusOverview');
    if (!overviewEl) return;
    const totalRA = ordersRA.length, totalRD = ordersRD.length, totalFusion = ordersFusion.length;
    const dpsFused = new Set(ordersFusion.map(o => o.dp).filter(Boolean));
    const dpsBlown = new Set(ordersRD.map(o => o.dp).filter(Boolean));
    const certReady = [...dpsFused].filter(dp => dpsBlown.has(dp)).length;
    overviewEl.innerHTML = `
        <fieldset><legend>Soplado RA</legend><div class="status-val-98" style="color:#000080">${totalRA}</div></fieldset>
        <fieldset><legend>Soplado RD</legend><div class="status-val-98" style="color:#008080">${totalRD}</div></fieldset>
        <fieldset><legend>Fusion</legend><div class="status-val-98" style="color:#804000">${totalFusion}</div></fieldset>
        <fieldset><legend>Listos Cert.</legend><div class="status-val-98" style="color:#008000">${certReady}</div></fieldset>
    `;
}

function renderProductivityGrid() {
    const gridEl = document.getElementById('productivityGrid');
    if (!gridEl) return;
    const techStats = {};
    ordersRA.forEach(o => {
        const tech = o.technician || 'Unknown';
        if (!techStats[tech]) techStats[tech] = { orders: 0, ra: 0, rd: 0, fusion: 0, meters: 0, splices: 0 };
        techStats[tech].orders++; techStats[tech].ra++; techStats[tech].meters += parseFloat(o.meters) || 0;
    });
    ordersRD.forEach(o => {
        const tech = o.technician || 'Unknown';
        if (!techStats[tech]) techStats[tech] = { orders: 0, ra: 0, rd: 0, fusion: 0, meters: 0, splices: 0 };
        techStats[tech].orders++; techStats[tech].rd++; techStats[tech].meters += parseFloat(o.meters) || 0;
    });
    ordersFusion.forEach(o => {
        const tech = o.technician || 'Unknown';
        if (!techStats[tech]) techStats[tech] = { orders: 0, ra: 0, rd: 0, fusion: 0, meters: 0, splices: 0 };
        techStats[tech].orders++; techStats[tech].fusion++; techStats[tech].splices += parseFloat(o.splices) || 0;
    });
    if (Object.keys(techStats).length === 0) { gridEl.innerHTML = '<p style="color:#808080;text-align:center">Sin datos de tecnicos</p>'; return; }
    gridEl.innerHTML = Object.entries(techStats).map(([tech, s]) => {
        const prod = s.orders > 15 ? 'Alta' : s.orders > 8 ? 'Media' : 'Baja';
        const prodColor = s.orders > 15 ? '#008000' : s.orders > 8 ? '#804000' : '#800000';
        return `<fieldset><legend>${tech}</legend>
            <div class="tech-stat-row"><span>Total:</span><span style="color:#008000;font-weight:bold">${s.orders}</span></div>
            <div class="tech-stat-row"><span>Productividad:</span><span style="color:${prodColor};font-weight:bold">${prod}</span></div>
            <div class="tech-stat-row"><span>RA/RD/Fusion:</span><span>${s.ra}/${s.rd}/${s.fusion}</span></div>
            <div class="tech-stat-row"><span>Metros:</span><span>${s.meters.toFixed(0)}</span></div>
            <div class="tech-stat-row"><span>Fusiones:</span><span>${s.splices}</span></div>
        </fieldset>`;
    }).join('');
}

function renderActivityFeed() {
    const feedEl = document.getElementById('activityFeed');
    if (!feedEl) return;
    const activities = [];
    ordersRA.forEach(o => { if (o.timestamp || o.startDate) activities.push({ action: 'RA: ' + o.projectCode + ' - ' + o.technician + ' (' + o.meters + 'm)', time: o.timestamp || o.startDate }); });
    ordersRD.forEach(o => { if (o.timestamp || o.startDate) activities.push({ action: 'RD: ' + o.projectCode + ' ' + o.dp + ' ' + o.ka + ' - ' + o.technician + ' (' + o.meters + 'm)', time: o.timestamp || o.startDate }); });
    ordersFusion.forEach(o => { if (o.timestamp || o.startDate) activities.push({ action: 'Fusion: ' + o.projectCode + ' ' + o.dp + ' - ' + o.technician + ' (' + o.splices + ' fusiones)', time: o.timestamp || o.startDate }); });
    activities.sort((a, b) => new Date(b.time) - new Date(a.time));
    const latest = activities.slice(0, 10);
    if (!latest.length) { feedEl.innerHTML = '<p style="color:#808080;text-align:center">Sin actividad reciente</p>'; return; }
    feedEl.innerHTML = latest.map(a => `<div class="activity-item-98"><div>${a.action}</div><span class="time">${a.time}</span></div>`).join('');
}

// ============================================
// SECTION 10: CLIENTS
// ============================================
function updateClientFilters() {
    const projs = [...new Set(clients.map(c => c.projectCode).filter(Boolean))].sort();
    const dps = [...new Set(clients.map(c => c.dp).filter(Boolean))].sort();
    const pSel = document.getElementById('clientFilterProject');
    const dSel = document.getElementById('clientFilterDP');
    if (!pSel || !dSel) return;
    const pv = pSel.value, dv = dSel.value;
    pSel.innerHTML = '<option value="">Todos</option>' + projs.map(p => `<option value="${p}">${p}</option>`).join('');
    dSel.innerHTML = '<option value="">Todos DP</option>' + dps.map(d => `<option value="${d}">${d}</option>`).join('');
    pSel.value = pv; dSel.value = dv;
}

function sortClients(field) {
    if (clientSort.field === field) clientSort.dir *= -1;
    else { clientSort.field = field; clientSort.dir = 1; }
    renderClients();
}

function filterClientsByStatus(status) {
    WM.open('clients');
    setTimeout(() => {
        const fsEl = document.getElementById('clientFilterStatus');
        const fcEl = document.getElementById('clientFilterContract');
        if (fsEl) fsEl.value = status;
        if (fcEl) fcEl.value = 'R0';
        renderClients();
    }, 50);
}

function getFilteredClients() {
    const searchEl = document.getElementById('clientSearch');
    const fpEl = document.getElementById('clientFilterProject');
    const fdEl = document.getElementById('clientFilterDP');
    const fsEl = document.getElementById('clientFilterStatus');
    const fcEl = document.getElementById('clientFilterContract');

    const search = (searchEl?.value || '').toLowerCase();
    const fp = fpEl ? fpEl.value : '';
    const fd = fdEl ? fdEl.value : '';
    const fs = fsEl ? fsEl.value : '';
    const fc = fcEl ? fcEl.value : '';

    let filtered = clients.filter(c => {
        if (search && !`${c.auftrag} ${c.dp} ${c.street} ${c.hausnummer} ${c.cableId}`.toLowerCase().includes(search)) return false;
        if (fp && c.projectCode !== fp) return false;
        if (fd && c.dp !== fd) return false;
        if (fs && c.status !== fs) return false;
        if (fc === 'R0' && c.contract !== 'R0') return false;
        if (fc === 'noR0' && c.contract === 'R0') return false;
        if (fc === 'R1' && c.contract !== 'R1') return false;
        if (fc === 'R18' && c.contract !== 'R18') return false;
        if (fc === 'R20' && c.contract !== 'R20') return false;
        if (fc === 'none' && c.contract) return false;
        return true;
    });

    const f = clientSort.field;
    filtered.sort((a, b) => {
        const va = (f === 'auftrag' ? a.auftrag : f === 'dp' ? a.dp : f === 'street' ? a.street : f === 'cableId' ? a.cableId : f === 'contract' ? a.contract : f === 'status' ? a.status : a.phase) || '';
        const vb = (f === 'auftrag' ? b.auftrag : f === 'dp' ? b.dp : f === 'street' ? b.street : f === 'cableId' ? b.cableId : f === 'contract' ? b.contract : f === 'status' ? b.status : b.phase) || '';
        return va.localeCompare(vb) * clientSort.dir;
    });
    return filtered;
}

function renderClients() {
    updateClientFilters();
    const searchEl = document.getElementById('clientSearch');
    if (!searchEl) return;
    const filtered = getFilteredClients();

    const tbody = document.getElementById('clientsBody');
    if (!tbody) return;
    if (!filtered.length) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:20px;color:#808080">${t('noData')}</td></tr>`;
    } else {
        tbody.innerHTML = filtered.map(c => {
            const addr = `${c.street} ${c.hausnummer}${c.hausnummerZusatz ? ' '+c.hausnummerZusatz : ''}`;
            const statusBadge = getStatusBadge(c.status);
            const contractBadge = getContractBadge(c.contract);
            return `<tr>
                <td style="font-size:10px">${c.auftrag}</td>
                <td><strong>${c.dp}</strong></td>
                <td>${addr}</td>
                <td style="font-size:10px">${c.cableId}</td>
                <td>${contractBadge}</td>
                <td>${statusBadge}</td>
                <td style="font-size:11px">${c.phase}</td>
            </tr>`;
        }).join('');
    }

    const r0Count = filtered.filter(c => c.contract === 'R0').length;
    const countEl = document.getElementById('clientCount');
    if (countEl) countEl.textContent = filtered.length + ' mostrados | ' + r0Count + ' clientes R0 | ' + clients.length + ' total';

    const statusEl = document.getElementById('winstatus-clients');
    if (statusEl) statusEl.textContent = filtered.length + ' mostrados | ' + r0Count + ' R0 (clientes) | ' + clients.length + ' total direcciones';
}

function getStatusBadge(status) {
    const map = { '108': 'red', '109': 'blue', '103': 'yellow', '102': 'purple', '101': 'orange', '100': 'orange', '0': 'gray', 'Fertig': 'green' };
    return `<span class="badge-98 ${map[status] || 'gray'}">${status}</span>`;
}

function getContractBadge(contract) {
    if (contract === 'R0') return '<span class="badge-98 green">R0 Cliente</span>';
    if (!contract) return '<span class="badge-98 gray">--</span>';
    const map = { 'R1': 'orange', 'R18': 'blue', 'R20': 'yellow' };
    return `<span class="badge-98 ${map[contract] || 'gray'}">${contract}</span>`;
}

// ============================================
// SECTION 11: ORDERS
// ============================================
function switchOrderTab(tab) {
    currentOrderTab = tab;
    const tablist = document.querySelectorAll('.win-tabs [role="tab"]');
    tablist.forEach(t => t.setAttribute('aria-selected', false));
    const tabs = ['ra', 'rd', 'fusion'];
    const idx = tabs.indexOf(tab);
    if (tablist[idx]) tablist[idx].setAttribute('aria-selected', true);
    document.querySelectorAll('.win-tab-content').forEach(c => c.classList.remove('active'));
    const tabEl = document.getElementById('tab-' + tab);
    if (tabEl) tabEl.classList.add('active');
}

function applyOrderFilters() {
    orderFilters.search = (document.getElementById('orderSearch')?.value || '').toLowerCase();
    orderFilters.technician = document.getElementById('filterTechnician')?.value || '';
    orderFilters.project = document.getElementById('filterProject')?.value || '';
    renderOrders();
}

function updateOrderFilterDropdowns() {
    const techs = new Set(), projs = new Set();
    [...ordersRA, ...ordersRD, ...ordersFusion].forEach(o => {
        if (o.technician) techs.add(o.technician);
        if (o.projectCode) projs.add(o.projectCode);
    });
    const techSel = document.getElementById('filterTechnician');
    const projSel = document.getElementById('filterProject');
    if (techSel) {
        const v = techSel.value;
        techSel.innerHTML = '<option value="">Todos Tecnicos</option>' + [...techs].sort().map(t => `<option value="${t}">${t}</option>`).join('');
        techSel.value = v;
    }
    if (projSel) {
        const v = projSel.value;
        projSel.innerHTML = '<option value="">Todos Proyectos</option>' + [...projs].sort().map(p => `<option value="${p}">${p}</option>`).join('');
        projSel.value = v;
    }
}

function filterOrders(orders) {
    return orders.filter(o => {
        if (orderFilters.technician && o.technician !== orderFilters.technician) return false;
        if (orderFilters.project && o.projectCode !== orderFilters.project) return false;
        if (orderFilters.search) {
            const haystack = `${o.projectCode} ${o.dp || ''} ${o.technician} ${o.street || ''} ${o.ka || ''}`.toLowerCase();
            if (!haystack.includes(orderFilters.search)) return false;
        }
        return true;
    });
}

function renderPhotoLinks(photosStr) {
    if (!photosStr || photosStr.trim() === '' || photosStr === 'https://drive.google.com/') return '<span style="color:#808080">--</span>';
    return photosStr.split(',').map(url => {
        url = url.trim();
        if (!url) return '';
        const display = url.length > 40 ? url.substring(0, 37) + '...' : url;
        return `<a href="${url}" target="_blank" style="color:#000080;font-size:10px">${display}</a>`;
    }).filter(Boolean).join('<br>');
}

function toggleOrderDetail(tr, type, index) {
    const existing = tr.nextElementSibling;
    if (existing && existing.classList.contains('order-detail-row')) { existing.remove(); return; }
    tr.closest('tbody').querySelectorAll('.order-detail-row').forEach(r => r.remove());

    const orders = type === 'ra' ? filterOrders(ordersRA) : type === 'rd' ? filterOrders(ordersRD) : filterOrders(ordersFusion);
    const o = orders[index];
    if (!o) return;

    const colspan = type === 'ra' ? 9 : type === 'rd' ? 10 : 7;
    const df = (label, value) => `<div class="detail-field"><div class="detail-label">${label}</div><div class="detail-value">${value || '--'}</div></div>`;
    let fields = '';

    if (type === 'ra') {
        fields = df('Timestamp', o.timestamp) + df('Proyecto', o.projectCode) + df('Tecnico', o.technician)
            + df('Inicio - Fin', (o.startDate||'?') + ' - ' + (o.endDate||'?'))
            + df('Fibras', o.fibers) + df('Metros', o.meters) + df('Color', o.color)
            + (o.incidents ? `<div class="detail-field"><div class="detail-label">Incidencias</div><div class="detail-value detail-incident">${o.incidents}</div></div>` : '')
            + `<div class="detail-field detail-photos"><div class="detail-label">Fotos</div>${renderPhotoLinks(o.photos)}</div>`;
    } else if (type === 'rd') {
        fields = df('Timestamp', o.timestamp) + df('Proyecto', o.projectCode) + df('DP', o.dp) + df('Calle', o.street) + df('KA', o.ka)
            + df('Tecnico', o.technician) + df('Inicio - Fin', (o.startDate||'?') + ' - ' + (o.endDate||'?'))
            + df('Metros', o.meters) + df('Color', o.color) + df('Fibras', o.fibers)
            + (o.incidents ? `<div class="detail-field"><div class="detail-label">Incidencias</div><div class="detail-value detail-incident">${o.incidents}</div></div>` : '')
            + `<div class="detail-field detail-photos"><div class="detail-label">Fotos</div>${renderPhotoLinks(o.photos)}</div>`;
    } else {
        fields = df('Timestamp', o.timestamp) + df('Proyecto', o.projectCode) + df('DP', o.dp) + df('Tecnico', o.technician)
            + df('Inicio - Fin', (o.startDate||'?') + ' - ' + (o.endDate||'?'))
            + df('Fusiones', o.splices)
            + (o.incidents ? `<div class="detail-field"><div class="detail-label">Incidencias</div><div class="detail-value detail-incident">${o.incidents}</div></div>` : '')
            + `<div class="detail-field detail-photos"><div class="detail-label">Fotos</div>${renderPhotoLinks(o.photos)}</div>`
            + `<div class="detail-field detail-photos"><div class="detail-label">Registro Fotografico</div>${renderPhotoLinks(o.photoRegistry)}</div>`;
    }

    const detailRow = document.createElement('tr');
    detailRow.className = 'order-detail-row';
    detailRow.innerHTML = `<td colspan="${colspan}"><div class="order-detail-content">${fields}</div></td>`;
    tr.after(detailRow);
}

function renderOrders() {
    updateOrderFilterDropdowns();
    const fRA = filterOrders(ordersRA);
    const fRD = filterOrders(ordersRD);
    const fFusion = filterOrders(ordersFusion);

    const raBody = document.getElementById('raBody');
    if (raBody) {
        raBody.innerHTML = fRA.length ? fRA.map((o, i) => `<tr class="order-row" onclick="toggleOrderDetail(this,'ra',${i})">
            <td>${o.startDate || o.timestamp}</td><td>${o.projectCode}</td><td>${o.dp || '-'}</td><td>${o.technician}</td>
            <td>${o.fibers}</td><td>${o.meters}</td><td>${o.color}</td><td style="font-size:10px">${o.incidents || '-'}</td>
            <td><button style="font-size:10px;padding:1px 4px" onclick="event.stopPropagation();deleteOrder('orders_ra',${o.id},'Soplado RA')">X</button></td>
        </tr>`).join('') : `<tr><td colspan="9" style="text-align:center;padding:20px;color:#808080">${t('noData')}</td></tr>`;
    }

    const rdBody = document.getElementById('rdBody');
    if (rdBody) {
        rdBody.innerHTML = fRD.length ? fRD.map((o, i) => `<tr class="order-row" onclick="toggleOrderDetail(this,'rd',${i})">
            <td>${o.startDate || o.timestamp}</td><td>${o.projectCode}</td><td>${o.dp}</td><td style="font-size:11px">${o.street}</td>
            <td>${o.ka}</td><td>${o.technician}</td><td>${o.meters}</td><td>${o.color}</td><td>${o.fibers}</td>
            <td><button style="font-size:10px;padding:1px 4px" onclick="event.stopPropagation();deleteOrder('orders_rd',${o.id},'Soplado RD')">X</button></td>
        </tr>`).join('') : `<tr><td colspan="10" style="text-align:center;padding:20px;color:#808080">${t('noData')}</td></tr>`;
    }

    const fusionBody = document.getElementById('fusionBody');
    if (fusionBody) {
        fusionBody.innerHTML = fFusion.length ? fFusion.map((o, i) => `<tr class="order-row" onclick="toggleOrderDetail(this,'fusion',${i})">
            <td>${o.startDate || o.timestamp}</td><td>${o.projectCode}</td><td>${o.dp}</td>
            <td>${o.technician}</td><td>${o.splices}</td><td style="font-size:10px">${o.incidents || '-'}</td>
            <td><button style="font-size:10px;padding:1px 4px" onclick="event.stopPropagation();deleteOrder('orders_fusion',${o.id},'Fusion')">X</button></td>
        </tr>`).join('') : `<tr><td colspan="7" style="text-align:center;padding:20px;color:#808080">${t('noData')}</td></tr>`;
    }

    // Status bar
    const statusEl = document.getElementById('winstatus-orders');
    if (statusEl) statusEl.textContent = 'RA: ' + fRA.length + ' | RD: ' + fRD.length + ' | Fusion: ' + fFusion.length;
}

// ============================================
// SECTION 12: PROJECTS
// ============================================
function toggleProject(code) {
    if (expandedProjects.has(code)) expandedProjects.delete(code);
    else expandedProjects.add(code);
    renderProjects();
}

function renderProjects() {
    const projMap = {};
    clients.forEach(c => {
        if (!c.projectCode) return;
        if (!projMap[c.projectCode]) projMap[c.projectCode] = { total:0, dps: new Set(), statusCounts: {'108':0,'109':0,'103':0,'102':0,'101':0,'100':0,'0':0,'Fertig':0} };
        projMap[c.projectCode].total++;
        projMap[c.projectCode].dps.add(c.dp);
        const s = c.status in projMap[c.projectCode].statusCounts ? c.status : '0';
        projMap[c.projectCode].statusCounts[s]++;
    });

    // Also include projects from GO status that may not have clients yet
    goStatus.forEach(g => {
        if (!g.projectCode) return;
        if (!projMap[g.projectCode]) projMap[g.projectCode] = { total:0, dps: new Set(), statusCounts: {'108':0,'109':0,'103':0,'102':0,'101':0,'100':0,'0':0,'Fertig':0} };
        projMap[g.projectCode].dps.add(g.dp);
    });

    // Key GO status by projectCode+dp to avoid mixing DPs across projects
    const goByProjDP = {};
    goStatus.forEach(g => { goByProjDP[(g.projectCode || '') + '|' + g.dp] = g; });

    let html = '';
    Object.entries(projMap).sort((a,b) => a[0].localeCompare(b[0])).forEach(([code, data]) => {
        const isExpanded = expandedProjects.has(code);
        const fertigPct = data.total ? Math.round(data.statusCounts['Fertig'] / data.total * 100) : 0;
        const colors = { '108':'#800000', '109':'#000080', '103':'#808000', '102':'#400080', '101':'#804000', '100':'#804000', '0':'#808080', 'Fertig':'#008000' };

        let barHtml = '';
        for (const [s, cnt] of Object.entries(data.statusCounts)) {
            if (cnt > 0) barHtml += `<div style="width:${(cnt/data.total*100).toFixed(1)}%;background:${colors[s]}" title="${s}: ${cnt}"></div>`;
        }

        let blowDone = 0, spliceAPDone = 0, spliceDPDone = 0;
        data.dps.forEach(dp => {
            const g = goByProjDP[code + '|' + dp];
            if (g) {
                if (g.einblasenAPDP?.toUpperCase().includes('GEREED')) blowDone++;
                if (g.spleissenAP?.toUpperCase().includes('GEREED')) spliceAPDone++;
                if (g.spleisseDPbereit?.toUpperCase().includes('GEREED')) spliceDPDone++;
            }
        });

        const raCount = ordersRA.filter(o => o.projectCode === code).length;
        const rdCount = ordersRD.filter(o => o.projectCode === code).length;
        const fusionCount = ordersFusion.filter(o => o.projectCode === code).length;

        let dpTableHtml = '';
        if (isExpanded) {
            const sortedDPs = [...data.dps].sort();
            let dpRows = '';
            for (const dp of sortedDPs) {
                const g = goByProjDP[code + '|' + dp];
                const blowOK = g?.einblasenAPDP?.toUpperCase().includes('GEREED');
                const spliceAPOK = g?.spleissenAP?.toUpperCase().includes('GEREED');
                const spliceDPOK = g?.spleisseDPbereit?.toUpperCase().includes('GEREED');
                const hasRA = ordersRA.some(o => o.projectCode === code);
                const hasRD = ordersRD.some(o => o.projectCode === code && normalizeDP(o.dp) === normalizeDP(dp));
                const hasFusion = ordersFusion.some(o => o.projectCode === code && normalizeDP(o.dp) === normalizeDP(dp));

                let orderIcons = '';
                if (hasRA) orderIcons += '<span class="badge-98 blue" style="margin:0 1px">RA</span>';
                if (hasRD) orderIcons += '<span class="badge-98 orange" style="margin:0 1px">RD</span>';
                if (hasFusion) orderIcons += '<span class="badge-98 purple" style="margin:0 1px">FU</span>';
                if (!hasRA && !hasRD && !hasFusion) orderIcons = '<span style="color:#808080">-</span>';

                let warnings = [];
                if (hasRA && !blowOK) warnings.push('Soplado hecho, NO en GO');
                if (hasFusion && !spliceAPOK) warnings.push('Fusion hecha, NO en GO');

                const allGO = blowOK && spliceAPOK && spliceDPOK;
                const anyGO = blowOK || spliceAPOK || spliceDPOK;
                const anyWork = hasRA || hasRD || hasFusion;
                const rowClass = allGO ? 'dp-row-green' : (anyGO || anyWork) ? 'dp-row-yellow' : 'dp-row-red';

                const okMark = '<span style="color:#008000;font-weight:bold">OK</span>';
                const xMark = '<span style="color:#cc0000">X</span>';
                const pendMark = '<span style="color:#808080">~</span>';

                let statusHtml;
                if (warnings.length) statusHtml = '<span style="color:#cc0000">' + warnings.join(', ') + '</span>';
                else if (allGO) statusHtml = '<span class="badge-98 green">GEREED</span>';
                else if (anyGO) statusHtml = '<span class="badge-98 yellow">Parcial</span>';
                else if (anyWork) statusHtml = '<span class="badge-98 orange">Falta GO</span>';
                else statusHtml = '<span class="badge-98 gray">' + t('pendiente') + '</span>';

                dpRows += `<tr class="${rowClass}">
                    <td><strong>${dp}</strong></td>
                    <td style="text-align:center">${blowOK ? okMark : hasRA ? pendMark : xMark}</td>
                    <td style="text-align:center">${spliceAPOK ? okMark : hasFusion ? pendMark : xMark}</td>
                    <td style="text-align:center">${spliceDPOK ? okMark : xMark}</td>
                    <td>${orderIcons}</td>
                    <td>${statusHtml}</td>
                </tr>`;
            }
            dpTableHtml = `<div class="project-dp-wrapper" onclick="event.stopPropagation()">
                <div style="font-size:10px;color:#808080;margin-bottom:4px">${sortedDPs.length} DPs en ${code}</div>
                <div class="sunken-panel"><table>
                <thead><tr>
                    <th>${t('dpNumber')}</th><th style="text-align:center">${t('sopladoRA')}</th><th style="text-align:center">${t('fusionAP')}</th>
                    <th style="text-align:center">${t('fusionDP')}</th><th>Ordenes</th><th>${t('statusCol')}</th>
                </tr></thead>
                <tbody>${dpRows}</tbody>
            </table></div></div>`;
        }

        // Status legend for the color bar
        let legendHtml = '';
        for (const [s, cnt] of Object.entries(data.statusCounts)) {
            if (cnt > 0) legendHtml += `<span style="font-size:9px;margin-right:6px"><span style="display:inline-block;width:8px;height:8px;background:${colors[s]};border:1px solid #808080;vertical-align:middle"></span> ${s}: ${cnt}</span>`;
        }

        const expandedClass = isExpanded ? ' project-expanded' : '';

        html += `<fieldset class="${expandedClass}" onclick="toggleProject('${code}')">
            <legend style="color:#000080;font-weight:bold">${code} ${isExpanded ? '[-]' : '[+]'}</legend>
            <div class="project-stat-row"><span>DPs</span><span>${data.dps.size}</span></div>
            <div class="project-stat-row"><span>${t('totalClients')}</span><span>${data.total}</span></div>
            <div class="status-bar-98">${barHtml}</div>
            <div style="margin:2px 0 4px">${legendHtml}</div>
            <div class="project-stat-row"><span>${t('blowingDone')} (GO)</span><span>${blowDone}/${data.dps.size}</span></div>
            <div class="project-stat-row"><span>${t('splicingAP')} (GO)</span><span>${spliceAPDone}/${data.dps.size}</span></div>
            <div class="project-stat-row"><span>${t('splicingDP')} (GO)</span><span>${spliceDPDone}/${data.dps.size}</span></div>
            <div style="border-top:1px solid #808080;margin-top:4px;padding-top:4px">
                <div class="project-stat-row"><span>Soplado RA</span><span>${raCount}</span></div>
                <div class="project-stat-row"><span>Soplado RD</span><span>${rdCount}</span></div>
                <div class="project-stat-row"><span>Fusion</span><span>${fusionCount}</span></div>
            </div>
            <div class="project-fertig-row">
                <span>Fertig: <strong style="color:#008000">${data.statusCounts['Fertig']}</strong> (${fertigPct}%)</span>
                <div role="progressbar" class="progress-indicator" style="width:100%"><div class="progress-indicator-bar" style="width:${fertigPct}%"></div></div>
            </div>
            ${isExpanded ? dpTableHtml : `<div style="color:#000080;font-size:10px;text-align:center;margin-top:6px;padding-top:4px;border-top:1px dotted #c0c0c0">${t('clickExpandir')}</div>`}
        </fieldset>`;
    });

    const grid = document.getElementById('projectsGrid');
    if (grid) grid.innerHTML = html || `<p style="color:#808080">${t('noData')}</p>`;

    const statusEl = document.getElementById('winstatus-projects');
    if (statusEl) statusEl.textContent = Object.keys(projMap).length + ' proyectos';
}

// ============================================
// SECTION 12b: NEW WORKS REPORT
// ============================================
function getNewWorksScaffold() {
    return `
    <div class="kpi-grid" id="newworksKPIs"></div>
    <fieldset style="margin-top:6px">
        <legend>Detalle de Trabajos</legend>
        <div id="newworksFilter" style="margin-bottom:6px"></div>
        <div class="sunken-panel" style="max-height:calc(100% - 140px);overflow:auto">
            <table>
                <thead id="newworksHead"></thead>
                <tbody id="newworksBody"></tbody>
            </table>
        </div>
    </fieldset>`;
}

function renderNewWorks() {
    const r = lastNewWorksReport;
    if (!r) {
        const body = document.getElementById('winbody-newworks');
        if (body) body.innerHTML = '<div style="padding:20px;text-align:center;color:#808080"><p style="font-size:14px">No hay reporte de nuevos trabajos</p><p style="font-size:11px">Importa un CSV de Reporte de Campo (Fusion o Soplado RD) para generar el reporte</p></div>';
        return;
    }

    const items = r.items;
    const newInDB = items.filter(i => i.isNewInDB);
    const alreadyInDB = items.filter(i => !i.isNewInDB);
    const notInGO = items.filter(i => i.goNotFound);
    const newNotInGO = r.type === 'fusion'
        ? newInDB.filter(i => !i.goSpliceAP && !i.goSpliceDP)
        : newInDB.filter(i => !i.goBlow);
    const withIncidents = items.filter(i => i.incidents && i.incidents.trim());

    // KPIs
    const kpiEl = document.getElementById('newworksKPIs');
    if (kpiEl) {
        const typeLabel = r.type === 'fusion' ? 'FUSION' : 'SOPLADO RD';
        let extraKPIs = '';
        if (r.type === 'rd') {
            const totalMeters = items.reduce((sum, i) => sum + (parseFloat(i.meters) || 0), 0);
            const matched = items.filter(i => i.matchStatus === 'match').length;
            const partial = items.filter(i => i.matchStatus === 'partial').length;
            const noMatch = items.filter(i => i.matchStatus === 'mismatch' || i.matchStatus === 'no_clients').length;
            extraKPIs = `
                <fieldset><legend>Total Metros</legend><div class="kpi-value" style="color:#008080">${Math.round(totalMeters)}m</div></fieldset>
                <fieldset><legend>Match Exacto</legend><div class="kpi-value" style="color:#008000">${matched}</div></fieldset>
                <fieldset><legend>Match Parcial</legend><div class="kpi-value" style="color:#804000">${partial}</div></fieldset>
                <fieldset><legend>Sin Match</legend><div class="kpi-value" style="color:#cc0000">${noMatch}</div></fieldset>`;
        }
        kpiEl.innerHTML = `
            <fieldset><legend>${typeLabel}</legend><div class="kpi-value" style="color:#000080">${items.length}</div></fieldset>
            <fieldset><legend>Nuevos en BD</legend><div class="kpi-value" style="color:#008000">${newInDB.length}</div></fieldset>
            <fieldset><legend>Ya Existian</legend><div class="kpi-value" style="color:#804000">${alreadyInDB.length}</div></fieldset>
            <fieldset><legend>No en GO</legend><div class="kpi-value" style="color:#800000">${notInGO.length}</div></fieldset>
            ${extraKPIs}
            <fieldset><legend>Con Incidencias</legend><div class="kpi-value" style="color:#804000">${withIncidents.length}</div></fieldset>
        `;
    }

    // Filter
    const filterEl = document.getElementById('newworksFilter');
    if (filterEl) {
        const matchFilterHTML = r.type === 'rd' ? `
            <select id="nwFilterMatch" onchange="renderNewWorksTable()">
                <option value="">Match: Todos</option>
                <option value="match">Exacto (>85%)</option>
                <option value="partial">Parcial (50-85%)</option>
                <option value="mismatch">Sin match (<50%)</option>
                <option value="no_clients">Sin clientes en DP</option>
            </select>` : '';
        filterEl.innerHTML = `<div class="filter-bar">
            <select id="nwFilterStatus" onchange="renderNewWorksTable()">
                <option value="">Todos</option>
                <option value="new">Solo nuevos en BD</option>
                <option value="notgo">No registrados en GO</option>
                <option value="newnotgo">Nuevos + No en GO</option>
                <option value="incidents">Con incidencias</option>
            </select>
            ${matchFilterHTML}
            <select id="nwFilterProject" onchange="renderNewWorksTable()">
                <option value="">Todos Proyectos</option>
                ${r.projects.map(p => `<option value="${p}">${p}</option>`).join('')}
            </select>
            <span style="font-size:10px;color:#808080;margin-left:4px">Importado: ${r.timestamp}</span>
        </div>`;
    }

    // Table header
    const headEl = document.getElementById('newworksHead');
    if (headEl) {
        if (r.type === 'fusion') {
            headEl.innerHTML = '<tr><th>Proyecto</th><th>DP</th><th>Tecnico</th><th>Fecha</th><th>Fusiones</th><th>Estado BD</th><th>GO Splice AP</th><th>GO Splice DP</th><th>Incidencias</th></tr>';
        } else {
            headEl.innerHTML = '<tr><th>Proyecto</th><th>DP</th><th>KA</th><th>Calle (Tecnico)</th><th>Cliente Match</th><th>Match %</th><th>Tecnico</th><th>Fecha</th><th>Metros</th><th>Color</th><th>Fibras</th><th>Estado BD</th><th>GO Einblasen</th><th>Incidencias</th></tr>';
        }
    }

    renderNewWorksTable();

    const statusEl = document.getElementById('winstatus-newworks');
    if (statusEl) {
        let statusText = (r.type === 'fusion' ? 'FUSION' : 'SOPLADO RD') + ' | ' + r.projects.join(', ') + ' | ' + newInDB.length + ' nuevos, ' + notInGO.length + ' no en GO';
        if (r.type === 'rd') {
            const totalMeters = items.reduce((sum, i) => sum + (parseFloat(i.meters) || 0), 0);
            const matched = items.filter(i => i.matchStatus === 'match').length;
            const partial = items.filter(i => i.matchStatus === 'partial').length;
            statusText += ' | ' + Math.round(totalMeters) + 'm | Match: ' + matched + ' ok, ' + partial + ' parcial';
        }
        statusEl.textContent = statusText;
    }
}

function renderNewWorksTable() {
    const r = lastNewWorksReport;
    if (!r) return;
    const tbody = document.getElementById('newworksBody');
    if (!tbody) return;

    const filterStatus = document.getElementById('nwFilterStatus')?.value || '';
    const filterProject = document.getElementById('nwFilterProject')?.value || '';

    let items = r.items;
    if (filterProject) items = items.filter(i => i.projCode === filterProject);
    if (filterStatus === 'new') items = items.filter(i => i.isNewInDB);
    if (filterStatus === 'notgo') items = items.filter(i => i.goNotFound);
    if (filterStatus === 'newnotgo') items = items.filter(i => i.isNewInDB && (r.type === 'fusion' ? (!i.goSpliceAP && !i.goSpliceDP) : !i.goBlow));
    if (filterStatus === 'incidents') items = items.filter(i => i.incidents && i.incidents.trim());

    // Match filter (RD only)
    const filterMatch = document.getElementById('nwFilterMatch')?.value || '';
    if (filterMatch && r.type === 'rd') {
        items = items.filter(i => i.matchStatus === filterMatch);
    }

    if (r.type === 'fusion') {
        tbody.innerHTML = items.map(i => {
            const dbBadge = i.isNewInDB ? '<span class="badge-98 green">NUEVO</span>' : '<span class="badge-98 gray">Ya existia</span>';
            const goAP = i.goNotFound ? '<span class="badge-98 red">No en GO</span>' : i.goSpliceAP ? '<span class="badge-98 green">GEREED</span>' : '<span class="badge-98 yellow">Pendiente</span>';
            const goDP = i.goNotFound ? '<span class="badge-98 red">No en GO</span>' : i.goSpliceDP ? '<span class="badge-98 green">GEREED</span>' : '<span class="badge-98 yellow">Pendiente</span>';
            const incBadge = i.incidents && i.incidents.trim() ? `<span class="badge-98 red" title="${i.incidents}">SI</span>` : '<span style="color:#808080">-</span>';
            const rowClass = i.isNewInDB && i.goNotFound ? 'dp-row-red' : i.isNewInDB ? 'dp-row-green' : '';
            return `<tr class="${rowClass}">
                <td><strong>${i.projCode}</strong></td>
                <td>${i.dp}</td>
                <td>${i.technician}</td>
                <td>${i.startDate || '-'}</td>
                <td style="text-align:center">${i.splices || '-'}</td>
                <td>${dbBadge}</td>
                <td>${goAP}</td>
                <td>${goDP}</td>
                <td>${incBadge}</td>
            </tr>`;
        }).join('') || '<tr><td colspan="9" style="text-align:center;padding:20px;color:#808080">Sin resultados</td></tr>';
    } else {
        tbody.innerHTML = items.map(i => {
            const dbBadge = i.isNewInDB ? '<span class="badge-98 green">NUEVO</span>' : '<span class="badge-98 gray">Ya existia</span>';
            const goBlw = i.goNotFound ? '<span class="badge-98 red">No en GO</span>' : i.goBlow ? '<span class="badge-98 green">GEREED</span>' : '<span class="badge-98 yellow">Pendiente</span>';
            const incBadge = i.incidents && i.incidents.trim() ? `<span class="badge-98 red" title="${i.incidents}">SI</span>` : '<span style="color:#808080">-</span>';

            // Match badge
            let matchBadge, matchPct;
            const pct = Math.round((i.matchScore || 0) * 100);
            if (i.matchStatus === 'match') {
                matchBadge = `<span class="badge-98 green" title="${i.matchClient?.addr || ''}">${i.matchClient?.addr || '?'}</span>`;
                matchPct = `<span style="color:#008000;font-weight:bold">${pct}%</span>`;
            } else if (i.matchStatus === 'partial') {
                matchBadge = `<span class="badge-98 yellow" title="BD: ${i.matchClient?.addr || ''}">${i.matchClient?.addr || '?'}</span>`;
                matchPct = `<span style="color:#804000;font-weight:bold">${pct}%</span>`;
            } else if (i.matchStatus === 'no_clients') {
                matchBadge = '<span class="badge-98 gray">Sin clientes</span>';
                matchPct = '<span style="color:#808080">-</span>';
            } else {
                matchBadge = `<span class="badge-98 red" title="Mejor: ${i.matchClient?.addr || 'N/A'}">NO MATCH</span>`;
                matchPct = `<span style="color:#cc0000">${pct}%</span>`;
            }

            const rowClass = i.matchStatus === 'mismatch' || i.matchStatus === 'no_clients' ? 'dp-row-red' : i.matchStatus === 'partial' ? 'dp-row-yellow' : '';
            return `<tr class="${rowClass}">
                <td><strong>${i.projCode}</strong></td>
                <td>${i.dp}</td>
                <td>${i.ka || '-'}</td>
                <td style="font-size:10px">${i.street || '-'}</td>
                <td style="font-size:10px">${matchBadge}</td>
                <td style="text-align:center">${matchPct}</td>
                <td>${i.technician}</td>
                <td>${i.startDate || '-'}</td>
                <td style="text-align:center">${i.meters || '-'}m</td>
                <td style="font-size:10px">${i.color || '-'}</td>
                <td style="text-align:center">${i.fibers || '-'}</td>
                <td>${dbBadge}</td>
                <td>${goBlw}</td>
                <td>${incBadge}</td>
            </tr>`;
        }).join('') || '<tr><td colspan="14" style="text-align:center;padding:20px;color:#808080">Sin resultados</td></tr>';
    }
}

// ============================================
// SECTION 13: INVOICING
// ============================================
function renderInvoicing() {
    const allOrders = legacyOrders;
    const certNotInv = allOrders.filter(o => o.status === 'certified');
    const invoiced = allOrders.filter(o => o.status === 'invoiced');

    const totalsEl = document.getElementById('invoiceTotals');
    if (totalsEl) {
        totalsEl.innerHTML = `
            <fieldset><legend>${t('certNotInv')}</legend><div class="kpi-value" style="color:#400080">${certNotInv.length}</div></fieldset>
            <fieldset><legend>${t('totalInvoiced')}</legend><div class="kpi-value" style="color:#008000">${invoiced.length}</div></fieldset>
            <fieldset><legend>Total Ordenes</legend><div class="kpi-value" style="color:#000080">${ordersRD.length + ordersRA.length + ordersFusion.length}</div></fieldset>
            <fieldset><legend>${t('totalClients')}</legend><div class="kpi-value" style="color:#008080">${clients.length}</div></fieldset>
        `;
    }

    const tbody = document.getElementById('invoiceBody');
    if (tbody) {
        tbody.innerHTML = certNotInv.map(o => `<tr>
            <td><input type="checkbox" class="inv-check" data-id="${o.id}"></td>
            <td>${o.project||''}</td><td>${o.address||''}</td><td>${o.units||1}</td>
            <td><span class="badge-98 purple">Certificado</span></td><td>${o.certified_date||''}</td>
        </tr>`).join('') || `<tr><td colspan="6" style="text-align:center;padding:20px;color:#808080">--</td></tr>`;

        document.querySelectorAll('.inv-check').forEach(cb => cb.addEventListener('change', () => {
            const btn = document.getElementById('markInvoicedBtn');
            if (btn) btn.style.display = document.querySelectorAll('.inv-check:checked').length > 0 ? '' : 'none';
        }));
    }

    const statusEl = document.getElementById('winstatus-invoicing');
    if (statusEl) statusEl.textContent = certNotInv.length + ' pendientes | ' + invoiced.length + ' facturados';
}

function toggleAllInv(master) {
    document.querySelectorAll('.inv-check').forEach(cb => cb.checked = master.checked);
    const btn = document.getElementById('markInvoicedBtn');
    if (btn) btn.style.display = document.querySelectorAll('.inv-check:checked').length > 0 ? '' : 'none';
}

async function markInvoiced() {
    const ids = [...document.querySelectorAll('.inv-check:checked')].map(cb => parseInt(cb.dataset.id));
    if (!ids.length) return;
    const invNum = prompt('No Factura:');
    if (!invNum) return;
    for (const id of ids) {
        const o = legacyOrders.find(x => x.id === id);
        if (o) { o.status = 'invoiced'; o.invoice_number = invNum; await dbPut('orders', o); }
    }
    await loadAll();
    renderOpenWindows();
    toast(ids.length + ' marcados como facturados');
}

// ============================================
// SECTION 14: PRICES
// ============================================
function renderPrices() {
    const pricesBody = document.getElementById('pricesBody');
    if (!pricesBody) return;
    let totalMarginPct = 0, count = 0;
    pricesBody.innerHTML = PRICE_LIST.map(p => {
        const margin = p.sale - p.cost;
        const pct = p.sale > 0 ? margin / p.sale * 100 : 0;
        if (p.cost > 0) { totalMarginPct += pct; count++; }
        const color = pct >= 50 ? '#008000' : pct >= 30 ? '#808000' : '#804000';
        const d = lang === 'de' ? (p.descDe || p.desc) : p.desc;
        return `<tr>
            <td><strong>${p.code}</strong></td><td>${d}</td><td>${p.unit}</td>
            <td style="text-align:right">${p.sale.toFixed(2)}</td>
            <td style="text-align:right">${p.cost > 0 ? p.cost.toFixed(2) : '-'}</td>
            <td style="text-align:right;color:${color}">${p.cost > 0 ? margin.toFixed(2) : '-'}</td>
            <td style="text-align:right;color:${color}">${p.cost > 0 ? pct.toFixed(1)+'%' : '-'}</td>
        </tr>`;
    }).join('');

    const totalEl = document.getElementById('priceTotalItems');
    const avgEl = document.getElementById('priceAvgMargin');
    if (totalEl) totalEl.textContent = PRICE_LIST.length;
    if (avgEl) avgEl.textContent = count > 0 ? (totalMarginPct / count).toFixed(1) + '%' : '-';

    const statusEl = document.getElementById('winstatus-prices');
    if (statusEl) statusEl.textContent = PRICE_LIST.length + ' items | Margen prom. ' + (count > 0 ? (totalMarginPct / count).toFixed(1) + '%' : '-');
}

// ============================================
// SECTION 15: CRUD & UTILS
// ============================================
async function deleteOrder(store, id, label) {
    if (!confirm('Eliminar este registro de ' + label + '?')) return;
    await dbDelete(store, id);
    await loadAll();
    renderOpenWindows();
    toast('Registro eliminado de ' + label);
}

async function cleanRARecords() {
    if (!confirm('Eliminar TODAS las ordenes de Soplado RA?\n\nEsta accion no se puede deshacer.')) return;
    await dbClear('orders_ra'); ordersRA = [];
    await loadAll(); renderOpenWindows();
    toast('Ordenes Soplado RA eliminadas');
}

async function cleanRDRecords() {
    if (!confirm('Eliminar TODAS las ordenes de Soplado RD?\n\nEsta accion no se puede deshacer.')) return;
    await dbClear('orders_rd'); ordersRD = [];
    await loadAll(); renderOpenWindows();
    toast('Ordenes Soplado RD eliminadas');
}

async function cleanFusionRecords() {
    if (!confirm('Eliminar TODAS las ordenes de Fusion?\n\nEsta accion no se puede deshacer.')) return;
    await dbClear('orders_fusion'); ordersFusion = [];
    await loadAll(); renderOpenWindows();
    toast('Ordenes Fusion eliminadas');
}

function toExcel(headers, rows, sheetName) {
    const esc = v => (v||'').toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<?mso-application progid="Excel.Sheet"?>\n';
    xml += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n';
    xml += '<Styles><Style ss:ID="header"><Font ss:Bold="1"/><Interior ss:Color="#C0C0C0" ss:Pattern="Solid"/></Style></Styles>\n';
    xml += '<Worksheet ss:Name="' + esc(sheetName) + '"><Table>\n';
    // Headers
    xml += '<Row ss:StyleID="header">';
    headers.forEach(h => { xml += '<Cell><Data ss:Type="String">' + esc(h) + '</Data></Cell>'; });
    xml += '</Row>\n';
    // Data rows
    rows.forEach(row => {
        xml += '<Row>';
        row.forEach(v => {
            const val = (v||'').toString();
            const isNum = val !== '' && !isNaN(val) && val.trim() !== '';
            xml += '<Cell><Data ss:Type="' + (isNum ? 'Number' : 'String') + '">' + esc(val) + '</Data></Cell>';
        });
        xml += '</Row>\n';
    });
    xml += '</Table></Worksheet></Workbook>';
    return xml;
}

function exportData() {
    let headers, rows, filename, sheetName;

    if (WM.windows.has('clients')) {
        const filtered = getFilteredClients();
        headers = ['Auftrag','Projektnummer','Proyecto','DP','Strasse','Hausnummer','HausNrZusatz','Unit','CableID','Contract','Status','Phase','Farbe Rohre','Datum Hausanschluss'];
        rows = filtered.map(c => [c.auftrag,c.projektnummer,c.projectCode,c.dp,c.street,c.hausnummer,c.hausnummerZusatz,c.unit,c.cableId,c.contract,c.status,c.phase,c.farbeRohre,c.datumHausanschluss]);
        filename = 'clients-export.xls';
        sheetName = 'Clientes';
        toast('Exportando ' + filtered.length + ' de ' + clients.length + ' clientes');
    } else if (WM.windows.has('orders')) {
        if (currentOrderTab === 'ra') {
            headers = ['Timestamp','Project','Technician','StartDate','EndDate','Fibers','Meters','Color','Incidents'];
            rows = ordersRA.map(o => [o.timestamp,o.projectCode,o.technician,o.startDate,o.endDate,o.fibers,o.meters,o.color,o.incidents]);
            filename = 'orders-ra.xls'; sheetName = 'Soplado RA';
        } else if (currentOrderTab === 'rd') {
            headers = ['Timestamp','Project','DP','Street','KA','Technician','StartDate','EndDate','Meters','Color','Fibers'];
            rows = ordersRD.map(o => [o.timestamp,o.projectCode,o.dp,o.street,o.ka,o.technician,o.startDate,o.endDate,o.meters,o.color,o.fibers]);
            filename = 'orders-rd.xls'; sheetName = 'Soplado RD';
        } else {
            headers = ['Timestamp','Project','DP','Technician','StartDate','EndDate','Splices','Incidents'];
            rows = ordersFusion.map(o => [o.timestamp,o.projectCode,o.dp,o.technician,o.startDate,o.endDate,o.splices,o.incidents]);
            filename = 'orders-fusion.xls'; sheetName = 'Fusion';
        }
    } else {
        toast('Abre Clientes u Ordenes para exportar');
        return;
    }

    const xml = toExcel(headers, rows, sheetName);
    const blob = new Blob([xml], {type:'application/vnd.ms-excel'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = filename; a.click();
}

// Admin quick actions
function calculateGODiscrepancies() {
    try {
        const discrepancies = [];
        const goByProjDP = {};
        goStatus.forEach(g => { goByProjDP[(g.projectCode || '') + '|' + g.dp] = g; });

        ordersRD.forEach(o => {
            if (!o.dp) return;
            const g = goByProjDP[(o.projectCode || '') + '|' + o.dp];
            if (!g) discrepancies.push({ type: 'RD', project: o.projectCode, dp: o.dp, technician: o.technician, issue: 'DP no encontrado en GO' });
            else if (!g.einblasenAPDP?.toUpperCase().includes('GEREED'))
                discrepancies.push({ type: 'RD', project: o.projectCode, dp: o.dp, technician: o.technician, issue: 'Soplado hecho, no GEREED en GO' });
        });

        ordersFusion.forEach(o => {
            if (!o.dp) return;
            const g = goByProjDP[(o.projectCode || '') + '|' + o.dp];
            if (!g) discrepancies.push({ type: 'Fusion', project: o.projectCode, dp: o.dp, technician: o.technician, issue: 'DP no encontrado en GO' });
            else if (!g.spleissenAP?.toUpperCase().includes('GEREED') && !g.spleisseDPbereit?.toUpperCase().includes('GEREED'))
                discrepancies.push({ type: 'Fusion', project: o.projectCode, dp: o.dp, technician: o.technician, issue: 'Fusion hecha, no GEREED en GO' });
        });

        goStatus.forEach(g => {
            const gProj = g.projectCode || '';
            if (g.einblasenAPDP?.toUpperCase().includes('GEREED')) {
                if (!ordersRD.some(o => o.projectCode === gProj && o.dp === g.dp))
                    discrepancies.push({ type: 'GO->RD', project: gProj || g.projekt || g.projektnummer, dp: g.dp, technician: '-', issue: 'GEREED en GO pero sin orden RD' });
            }
            if (g.spleissenAP?.toUpperCase().includes('GEREED')) {
                if (!ordersFusion.some(o => o.projectCode === gProj && o.dp === g.dp))
                    discrepancies.push({ type: 'GO->Fusion', project: gProj || g.projekt || g.projektnummer, dp: g.dp, technician: '-', issue: 'GEREED en GO pero sin orden Fusion' });
            }
        });
        return discrepancies;
    } catch (error) { return []; }
}

function showPendingReview() {
    const withIncidents = [...ordersRA, ...ordersRD, ...ordersFusion].filter(o => o.incidents && o.incidents.trim() !== '');
    if (!withIncidents.length) { toast('Sin ordenes con incidencias pendientes.'); return; }
    const rows = withIncidents.map(o => {
        const tipo = ordersRA.includes(o) ? 'RA' : ordersRD.includes(o) ? 'RD' : 'Fusion';
        return `<tr>
            <td><span class="badge-98 blue">${tipo}</span></td>
            <td><strong>${o.projectCode || '-'}</strong></td>
            <td>${o.dp || '-'}</td>
            <td>${o.technician || '-'}</td>
            <td>${o.startDate || '-'}</td>
            <td style="font-size:10px;max-width:250px;word-wrap:break-word">${o.incidents}</td>
        </tr>`;
    }).join('');
    const html = `
        <div style="padding:4px 6px">
            <fieldset><legend>Resumen</legend>
                <div class="report-summary">
                    <fieldset><legend>Total Incidencias</legend><div class="rpt-val" style="color:#800000">${withIncidents.length}</div></fieldset>
                    <fieldset><legend>RA</legend><div class="rpt-val">${withIncidents.filter(o => ordersRA.includes(o)).length}</div></fieldset>
                    <fieldset><legend>RD</legend><div class="rpt-val">${withIncidents.filter(o => ordersRD.includes(o)).length}</div></fieldset>
                    <fieldset><legend>Fusion</legend><div class="rpt-val">${withIncidents.filter(o => ordersFusion.includes(o)).length}</div></fieldset>
                </div>
            </fieldset>
            <div class="sunken-panel" style="max-height:300px;overflow:auto;margin-top:6px">
                <table><thead><tr><th>Tipo</th><th>Proyecto</th><th>DP</th><th>Tecnico</th><th>Fecha</th><th>Incidencia</th></tr></thead>
                <tbody>${rows}</tbody></table>
            </div>
        </div>`;
    WM.openDialog('pendingReview', 'Revision Pendiente - ' + withIncidents.length + ' incidencias', html, 680, 440);
}

function showGODiscrepancies() {
    const discrepancies = calculateGODiscrepancies();
    if (discrepancies.length === 0) { toast('No hay discrepancias con GO FiberConnect'); return; }
    const typeCounts = {};
    discrepancies.forEach(d => { typeCounts[d.type] = (typeCounts[d.type] || 0) + 1; });
    const rows = discrepancies.map(d => {
        const color = d.type.startsWith('GO') ? '#804000' : '#800000';
        return `<tr>
            <td><span class="badge-98 ${d.type.startsWith('GO') ? 'yellow' : 'red'}">${d.type}</span></td>
            <td><strong>${d.project || '-'}</strong></td>
            <td>${d.dp || '-'}</td>
            <td>${d.technician || '-'}</td>
            <td style="font-size:10px">${d.issue}</td>
        </tr>`;
    }).join('');
    const summaryFields = Object.entries(typeCounts).map(([t, c]) =>
        `<fieldset><legend>${t}</legend><div class="rpt-val" style="color:#804000">${c}</div></fieldset>`
    ).join('');
    const html = `
        <div style="padding:4px 6px">
            <fieldset><legend>Resumen</legend>
                <div class="report-summary">
                    <fieldset><legend>Total</legend><div class="rpt-val" style="color:#800000">${discrepancies.length}</div></fieldset>
                    ${summaryFields}
                </div>
            </fieldset>
            <div class="sunken-panel" style="max-height:300px;overflow:auto;margin-top:6px">
                <table><thead><tr><th>Tipo</th><th>Proyecto</th><th>DP</th><th>Tecnico</th><th>Problema</th></tr></thead>
                <tbody>${rows}</tbody></table>
            </div>
        </div>`;
    WM.openDialog('goDiscrepancies', 'Discrepancias GO - ' + discrepancies.length + ' encontradas', html, 660, 440);
}

function qualityCheck() {
    const rdFusion = [...ordersRD, ...ordersFusion];
    const noPhotos = rdFusion.filter(o => !o.photos || o.photos.trim() === '' || o.photos === 'https://drive.google.com/');
    const zeroMeters = [...ordersRA, ...ordersRD].filter(o => !o.meters || parseFloat(o.meters) === 0);
    const zeroSplices = ordersFusion.filter(o => !o.splices || parseFloat(o.splices) === 0);
    const totalIssues = noPhotos.length + zeroMeters.length + zeroSplices.length;
    if (!totalIssues) { toast('Control de calidad OK - sin problemas detectados'); return; }

    const makeRows = (items, issue) => items.map(o => {
        const tipo = ordersRA.includes(o) ? 'RA' : ordersRD.includes(o) ? 'RD' : 'Fusion';
        return `<tr>
            <td><span class="badge-98 red">${issue}</span></td>
            <td><span class="badge-98 blue">${tipo}</span></td>
            <td><strong>${o.projectCode || '-'}</strong></td>
            <td>${o.dp || '-'}</td>
            <td>${o.technician || '-'}</td>
            <td>${o.startDate || '-'}</td>
        </tr>`;
    }).join('');
    const allRows = makeRows(noPhotos, 'Sin fotos') + makeRows(zeroMeters, 'Metros = 0') + makeRows(zeroSplices, 'Fusiones = 0');
    const html = `
        <div style="padding:4px 6px">
            <fieldset><legend>Resumen</legend>
                <div class="report-summary">
                    <fieldset><legend>Total Problemas</legend><div class="rpt-val" style="color:#800000">${totalIssues}</div></fieldset>
                    <fieldset><legend>Sin Fotos</legend><div class="rpt-val" style="color:#804000">${noPhotos.length}</div></fieldset>
                    <fieldset><legend>Metros = 0</legend><div class="rpt-val" style="color:#804000">${zeroMeters.length}</div></fieldset>
                    <fieldset><legend>Fusiones = 0</legend><div class="rpt-val" style="color:#804000">${zeroSplices.length}</div></fieldset>
                </div>
            </fieldset>
            <div class="sunken-panel" style="max-height:300px;overflow:auto;margin-top:6px">
                <table><thead><tr><th>Problema</th><th>Tipo</th><th>Proyecto</th><th>DP</th><th>Tecnico</th><th>Fecha</th></tr></thead>
                <tbody>${allRows}</tbody></table>
            </div>
        </div>`;
    WM.openDialog('qualityCheck', 'Control de Calidad - ' + totalIssues + ' problemas', html, 640, 440);
}

function syncWithGO() {
    const goByProjDP = {};
    goStatus.forEach(g => { goByProjDP[(g.projectCode || '') + '|' + g.dp] = g; });
    const allKeys = new Set([
        ...ordersRD.map(o => (o.projectCode||'') + '|' + o.dp),
        ...ordersFusion.map(o => (o.projectCode||'') + '|' + o.dp)
    ].filter(k => k !== '|'));
    if (!allKeys.size) { toast('No hay DPs con ordenes para comparar.'); return; }
    let gereedCount = 0, notGereedCount = 0, notInGOCount = 0;
    const rows = [...allKeys].sort().map(key => {
        const [proj, dp] = key.split('|');
        const g = goByProjDP[key];
        if (!g) {
            notInGOCount++;
            return `<tr class="dp-row-red"><td><strong>${proj}</strong></td><td>${dp}</td><td><span class="badge-98 red">No en GO</span></td><td><span class="badge-98 red">No en GO</span></td><td><span class="badge-98 red">NO</span></td></tr>`;
        }
        const blowOK = g.einblasenAPDP?.toUpperCase().includes('GEREED');
        const spliceOK = g.spleissenAP?.toUpperCase().includes('GEREED') || g.spleisseDPbereit?.toUpperCase().includes('GEREED');
        if (blowOK && spliceOK) {
            gereedCount++;
            return `<tr class="dp-row-green"><td><strong>${proj}</strong></td><td>${dp}</td><td><span class="badge-98 green">GEREED</span></td><td><span class="badge-98 green">GEREED</span></td><td><span class="badge-98 green">OK</span></td></tr>`;
        }
        notGereedCount++;
        return `<tr class="dp-row-yellow"><td><strong>${proj}</strong></td><td>${dp}</td>
            <td>${blowOK ? '<span class="badge-98 green">GEREED</span>' : '<span class="badge-98 yellow">Pendiente</span>'}</td>
            <td>${spliceOK ? '<span class="badge-98 green">GEREED</span>' : '<span class="badge-98 yellow">Pendiente</span>'}</td>
            <td><span class="badge-98 yellow">Parcial</span></td></tr>`;
    }).join('');
    const html = `
        <div style="padding:4px 6px">
            <fieldset><legend>Resumen (${allKeys.size} DPs)</legend>
                <div class="report-summary">
                    <fieldset><legend>GEREED</legend><div class="rpt-val" style="color:#008000">${gereedCount}</div></fieldset>
                    <fieldset><legend>Parcial</legend><div class="rpt-val" style="color:#804000">${notGereedCount}</div></fieldset>
                    <fieldset><legend>No en GO</legend><div class="rpt-val" style="color:#800000">${notInGOCount}</div></fieldset>
                </div>
            </fieldset>
            <div class="sunken-panel" style="max-height:300px;overflow:auto;margin-top:6px">
                <table><thead><tr><th>Proyecto</th><th>DP</th><th>Einblasen</th><th>Spleissen</th><th>Estado</th></tr></thead>
                <tbody>${rows}</tbody></table>
            </div>
        </div>`;
    WM.openDialog('goSync', 'GO Sync - ' + allKeys.size + ' DPs', html, 600, 440);
}

function bulkCertify() {
    const goByProjDP = {};
    goStatus.forEach(g => { goByProjDP[(g.projectCode || '') + '|' + g.dp] = g; });
    const rdKeys = new Set(ordersRD.map(o => (o.projectCode||'') + '|' + o.dp).filter(k => k !== '|'));
    const fusionKeys = new Set(ordersFusion.map(o => (o.projectCode||'') + '|' + o.dp).filter(k => k !== '|'));
    const readyKeys = [...rdKeys].filter(k => fusionKeys.has(k));
    if (!readyKeys.length) { toast('No hay DPs listos para certificar (necesitan RD + Fusion).'); return; }
    const rows = readyKeys.sort().map(key => {
        const [proj, dp] = key.split('|');
        const g = goByProjDP[key];
        const blowOK = g?.einblasenAPDP?.toUpperCase().includes('GEREED');
        const spliceOK = g?.spleissenAP?.toUpperCase().includes('GEREED') || g?.spleisseDPbereit?.toUpperCase().includes('GEREED');
        const allOK = blowOK && spliceOK;
        const goBadge = allOK ? '<span class="badge-98 green">GEREED</span>'
            : blowOK ? '<span class="badge-98 yellow">Solo Einblasen</span>'
            : spliceOK ? '<span class="badge-98 yellow">Solo Spleissen</span>'
            : '<span class="badge-98 red">No en GO</span>';
        return `<tr class="${allOK ? 'dp-row-green' : 'dp-row-yellow'}">
            <td><strong>${proj}</strong></td><td>${dp}</td>
            <td>${blowOK ? '<span class="badge-98 green">OK</span>' : '<span class="badge-98 yellow">X</span>'}</td>
            <td>${spliceOK ? '<span class="badge-98 green">OK</span>' : '<span class="badge-98 yellow">X</span>'}</td>
            <td>${goBadge}</td></tr>`;
    }).join('');
    const allGereed = readyKeys.filter(k => { const g = goByProjDP[k]; return g?.einblasenAPDP?.toUpperCase().includes('GEREED') && (g?.spleissenAP?.toUpperCase().includes('GEREED') || g?.spleisseDPbereit?.toUpperCase().includes('GEREED')); }).length;
    const html = `
        <div style="padding:4px 6px">
            <fieldset><legend>Resumen</legend>
                <div class="report-summary">
                    <fieldset><legend>DPs con RD+Fusion</legend><div class="rpt-val" style="color:#000080">${readyKeys.length}</div></fieldset>
                    <fieldset><legend>Todo GEREED</legend><div class="rpt-val" style="color:#008000">${allGereed}</div></fieldset>
                    <fieldset><legend>Falta GO</legend><div class="rpt-val" style="color:#804000">${readyKeys.length - allGereed}</div></fieldset>
                </div>
            </fieldset>
            <div class="sunken-panel" style="max-height:300px;overflow:auto;margin-top:6px">
                <table><thead><tr><th>Proyecto</th><th>DP</th><th>Einblasen</th><th>Spleissen</th><th>GO Status</th></tr></thead>
                <tbody>${rows}</tbody></table>
            </div>
        </div>`;
    WM.openDialog('bulkCertify', 'Certificacion - ' + readyKeys.length + ' DPs listos', html, 580, 440);
}

// ============================================
// SECTION 16: ORDER MODAL (Win98 dialog)
// ============================================
function openOrderModal(type) {
    editingOrderType = type;
    const title = type === 'ra' ? 'Agregar Soplado RA' : type === 'rd' ? 'Agregar Soplado RD' : 'Agregar Fusion';
    const fg = (id, label, tp, ph) => `<div class="field-row-stacked"><label for="om_${id}">${label}</label><input type="${tp||'text'}" id="om_${id}" placeholder="${ph||''}"></div>`;

    let html = '<div class="form-grid">';
    if (type === 'ra') {
        html += fg('projectCode','Proyecto','text','QFF-001') + fg('technician','Tecnico')
            + fg('startDate','Fecha Inicio','date') + fg('endDate','Fecha Fin','date')
            + fg('fibers','Fibras','number') + fg('meters','Metros','number')
            + `<div class="full-width">${fg('color','Color Miniducto')}</div>`
            + `<div class="full-width">${fg('incidents','Incidencias')}</div>`
            + `<div class="full-width">${fg('photos','Fotos (URLs)')}</div>`;
    } else if (type === 'rd') {
        html += fg('projectCode','Proyecto','text','QFF-001') + fg('dp','DP','text','DP055')
            + fg('street','Calle') + fg('ka','KA Cliente','text','KA28')
            + fg('technician','Tecnico') + fg('meters','Metros','number')
            + fg('startDate','Fecha Inicio','date') + fg('endDate','Fecha Fin','date')
            + fg('color','Color Miniducto') + fg('fibers','Fibras','number')
            + `<div class="full-width">${fg('incidents','Incidencias')}</div>`
            + `<div class="full-width">${fg('photos','Fotos (URLs)')}</div>`;
    } else {
        html += fg('projectCode','Proyecto','text','QFF-002') + fg('dp','DP','text','DP030')
            + fg('technician','Tecnico') + fg('splices','Fusiones','number')
            + fg('startDate','Fecha Inicio','date') + fg('endDate','Fecha Fin','date')
            + `<div class="full-width">${fg('incidents','Incidencias')}</div>`
            + `<div class="full-width">${fg('photos','Fotos (URLs)')}</div>`
            + `<div class="full-width">${fg('photoRegistry','Registro Fotografico')}</div>`;
    }
    html += '</div>';
    html += `<div style="text-align:right;margin-top:8px;padding-top:8px;border-top:1px solid #808080">
        <button class="default" onclick="saveOrderFromModal()">Guardar</button>
        <button onclick="document.getElementById('win-dlg-orderModal').remove()">Cancelar</button>
    </div>`;

    WM.openDialog('orderModal', title, html, 440, 380);
}

async function saveOrderFromModal() {
    const g = id => (document.getElementById('om_'+id)?.value || '').trim();
    const type = editingOrderType;
    const today = new Date().toISOString().split('T')[0];

    if (type === 'ra') {
        await dbPut('orders_ra', { timestamp: today, projectCode: g('projectCode'), technician: g('technician'), startDate: g('startDate'), endDate: g('endDate'), fibers: g('fibers'), meters: g('meters'), color: g('color'), incidents: g('incidents'), photos: g('photos') });
    } else if (type === 'rd') {
        await dbPut('orders_rd', { timestamp: today, projectCode: g('projectCode'), dp: normalizeDP(g('dp')), street: g('street'), ka: g('ka'), technician: g('technician'), startDate: g('startDate'), endDate: g('endDate'), meters: g('meters'), color: g('color'), incidents: g('incidents'), photos: g('photos'), fibers: g('fibers') });
    } else {
        await dbPut('orders_fusion', { timestamp: today, projectCode: g('projectCode'), dp: normalizeDP(g('dp')), technician: g('technician'), startDate: g('startDate'), endDate: g('endDate'), splices: g('splices'), incidents: g('incidents'), photos: g('photos'), photoRegistry: g('photoRegistry') });
    }
    await loadAll();
    if (type === 'rd') await autoUpdateFromRD();
    if (type === 'fusion') await autoUpdateFromFusion();
    await loadAll();
    renderOpenWindows();

    const dlg = document.getElementById('win-dlg-orderModal');
    if (dlg) dlg.remove();
    toast('Orden guardada');
}

// ============================================
// SECTION 17: START MENU, CLOCK & INIT
// ============================================
function toggleStartMenu() {
    const menu = document.getElementById('start-menu');
    menu.classList.toggle('open');
}

// Close start menu on outside click
document.addEventListener('click', (e) => {
    const menu = document.getElementById('start-menu');
    const btn = document.getElementById('start-button');
    if (menu.classList.contains('open') && !menu.contains(e.target) && !btn.contains(e.target)) {
        menu.classList.remove('open');
    }
});

// Clock
function updateClock() {
    const now = new Date();
    const h = now.getHours().toString().padStart(2, '0');
    const m = now.getMinutes().toString().padStart(2, '0');
    document.getElementById('taskbar-clock').textContent = h + ':' + m;
}
setInterval(updateClock, 30000);
updateClock();

// Smart upload drag and drop
function setupDragAndDrop() {
    const zone = document.getElementById('smartUploadZone');
    if (!zone) return;
    zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('dragover'); });
    zone.addEventListener('dragleave', (e) => { e.preventDefault(); zone.classList.remove('dragover'); });
    zone.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length) {
            const input = zone.querySelector('input[type="file"]');
            input.files = files;
            smartImport(input);
        }
    });
}

// ============================================
// LOGIN
// ============================================
const USERS = [
    { email: 'jromero@umtelkomd.com', password: '1234', name: 'J. Romero' }
];

let currentUser = null;

function doLogin() {
    const email = (document.getElementById('login-email').value || '').trim().toLowerCase();
    const pass = document.getElementById('login-pass').value || '';
    const errorEl = document.getElementById('login-error');
    const statusEl = document.getElementById('login-status');

    const user = USERS.find(u => u.email === email && u.password === pass);
    if (user) {
        currentUser = user;
        errorEl.style.display = 'none';
        statusEl.textContent = 'Bienvenido, ' + user.name;

        // Hide login, show app
        const loginScreen = document.getElementById('login-screen');
        loginScreen.style.opacity = '0';
        loginScreen.style.transition = 'opacity 0.3s ease';
        setTimeout(() => {
            loginScreen.style.display = 'none';
            document.getElementById('desktop').style.display = '';
            document.getElementById('taskbar').style.display = '';
            initApp();
        }, 300);
    } else {
        errorEl.style.display = '';
        statusEl.textContent = 'Error de autenticacion';
        const win = document.querySelector('.login-window');
        win.classList.remove('login-shake');
        void win.offsetWidth; // reflow
        win.classList.add('login-shake');
    }
}

// Enter key to submit login
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && document.getElementById('login-screen').style.display !== 'none') {
        doLogin();
    }
});

// ============================================
// INIT
// ============================================
function initApp() {
    openDB().then(async () => {
        await loadAll();
        WM.open('dashboard');
        setupDragAndDrop();
    });
}

// Service Worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('data:text/javascript,' + encodeURIComponent(
        "self.addEventListener('fetch', e => e.respondWith(fetch(e.request).catch(() => caches.match(e.request))));"
    )).catch(() => {});
}
