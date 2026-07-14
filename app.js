(() => {
    "use strict";

    const DATA = window.DATA_ANALISIS || {};
    const CONFIG = window.DASHBOARD_CONFIG || {};
    const ZOM_CODES = Object.keys(DATA).sort();
    const FEATURE_KEYS = ["enso", "iod", "sst", "itcz", "mjo", "monsun"];
    const REQUIRED_KEYS = ["enso", "iod", "sst"];
    const FEATURE_WEIGHTS = {
        enso: 2,
        iod: 2,
        sst: 2,
        itcz: 1,
        mjo: 1,
        monsun: 1
    };

    const COLORS = {
        dry: "#c84b31",
        wet: "#1d78b5",
        balanced: "#b98216",
        unavailable: "#a7b2bc",
        base: "#4d9bc3",
        border: "#34506a",
        hover: "#ffd166",
        selectedFill: "#f4a261",
        selectedBorder: "#7a2e0e"
    };

    const FEATURE_LABELS = {
        enso: {
            "el-nino": "ENSO: El Niño",
            "la-nina": "ENSO: La Niña",
            netral: "ENSO: Netral"
        },
        iod: {
            positif: "IOD: Positif",
            negatif: "IOD: Negatif",
            netral: "IOD: Netral"
        },
        sst: {
            positif: "SST lokal: Positif",
            negatif: "SST lokal: Negatif",
            netral: "SST lokal: Netral"
        },
        itcz: {
            aktif: "ITCZ: Aktif",
            "tidak-tercantum": "ITCZ: Tidak ada"
        },
        mjo: {
            indo: "MJO: Wilayah Indonesia",
            "tidak-tercantum": "MJO: Tidak ada"
        },
        monsun: {
            asia: "Monsun: Asia",
            australia: "Monsun: Australia",
            "tidak-tercantum": "Monsun: Tidak ada"
        }
    };

    const SHORT_LABELS = {
        enso: {
            "el-nino": "El Niño",
            "la-nina": "La Niña",
            netral: "ENSO Netral"
        },
        iod: {
            positif: "IOD Positif",
            negatif: "IOD Negatif",
            netral: "IOD Netral"
        },
        sst: {
            positif: "SST Lokal Positif",
            negatif: "SST Lokal Negatif",
            netral: "SST Lokal Netral"
        },
        itcz: {
            aktif: "ITCZ Aktif",
            "tidak-tercantum": "tanpa ITCZ"
        },
        mjo: {
            indo: "MJO Indonesia",
            "tidak-tercantum": "tanpa MJO"
        },
        monsun: {
            asia: "Monsun Asia",
            australia: "Monsun Australia",
            "tidak-tercantum": "tanpa monsun"
        }
    };

    const state = {
        map: null,
        geoJsonLayer: null,
        selectedZom: "",
        selectedLayer: null,
        layerByZom: new Map(),
        latestInput: null,
        analysisByZom: new Map(),
        relatedVisible: false,
        highlightAll: false
    };

    const elements = {};

    document.addEventListener("DOMContentLoaded", init);

    function init() {
        cacheElements();
        populateZomSelect();
        updateSummaryMetrics();
        bindEvents();
        bindShellEvents();
        initMap();
    }

    function cacheElements() {
        [
            "zom-select",
            "selected-zom-status",
            "input-enso",
            "input-iod",
            "input-sst",
            "input-itcz",
            "input-mjo",
            "input-monsun",
            "input-forecast-rain",
            "input-complex",
            "btn-analyze",
            "btn-reset",
            "btn-collapse",
            "btn-open-panel",
            "btn-toggle-related",
            "control-panel",
            "panel-content",
            "map-data-notice",
            "empty-state",
            "result-section",
            "match-status",
            "selected-conditions",
            "exact-result-content",
            "no-exact-content",
            "result-zom",
            "category-badge",
            "exact-combination-name",
            "target-combination-name",
            "prob-dry",
            "prob-wet",
            "prob-dry-bar",
            "prob-wet-bar",
            "mean-impact",
            "total-events",
            "evidence-level",
            "dry-impact",
            "wet-impact",
            "min-anomaly",
            "max-anomaly",
            "interpretation-box",
            "forecast-accuracy-section",
            "forecast-value",
            "historical-reference-value",
            "forecast-absolute-error",
            "forecast-accuracy-value",
            "forecast-accuracy-note",
            "related-section",
            "related-note",
            "related-combinations",
            "header-active-zom",
            "map-active-zom",
            "summary-zom-count",
            "summary-combination-count",
            "summary-record-count",
            "btn-fit-map",
            "btn-fit-map-label",
            "btn-sidebar",
            "sidebar",
            "sidebar-overlay",
            "notification-button",
            "notification-menu",
            "content-grid",
            "verification-workspace",
            "drawer-backdrop",
            "dataset-drawer",
            "glossary-drawer",
            "btn-close-dataset",
            "btn-close-glossary",
            "glossary-search",
            "glossary-list",
            "glossary-empty"
        ].forEach((id) => {
            elements[id] = document.getElementById(id);
        });
    }

    function bindEvents() {
        elements["zom-select"].addEventListener("change", (event) => {
            const code = event.target.value;
            if (code) {
                selectZom(code, true, "daftar");
            } else {
                clearSelectedZom();
                state.layerByZom.forEach((layer, layerCode) => applyLayerStyle(layerCode, layer));
            }
        });

        elements["btn-analyze"].addEventListener("click", runAnalysis);
        elements["btn-reset"].addEventListener("click", resetConditions);
        elements["btn-collapse"].addEventListener("click", collapsePanel);
        elements["btn-open-panel"].addEventListener("click", openPanel);
        elements["btn-toggle-related"].addEventListener("click", toggleRelated);
        elements["input-complex"].addEventListener("change", () => {
            toggleComplexMode(elements["input-complex"].checked);
            markResultStale();
        });

        document.querySelectorAll(".condition-input").forEach((select) => {
            select.addEventListener("change", markResultStale);
        });

        document.querySelectorAll(".accuracy-input").forEach((input) => {
            input.addEventListener("input", markResultStale);
        });
    }


    function updateSummaryMetrics() {
        const zomCount = ZOM_CODES.length;
        const combinationCount = zomCount > 0 ? (DATA[ZOM_CODES[0]] || []).length : 0;
        const recordCount = ZOM_CODES.reduce((total, code) => total + (DATA[code] || []).length, 0);

        if (elements["summary-zom-count"]) {
            elements["summary-zom-count"].textContent = `${formatInteger(zomCount)} ZOM`;
        }
        if (elements["summary-combination-count"]) {
            elements["summary-combination-count"].textContent = formatInteger(combinationCount);
        }
        if (elements["summary-record-count"]) {
            elements["summary-record-count"].textContent = formatInteger(recordCount);
        }
    }

    function bindShellEvents() {
        elements["btn-fit-map"]?.addEventListener("click", toggleKepriHighlight);
        elements["btn-sidebar"]?.addEventListener("click", toggleSidebar);
        elements["sidebar-overlay"]?.addEventListener("click", () => toggleMobileSidebar(false));

        document.querySelectorAll(".nav-item[data-action]").forEach((item) => {
            item.addEventListener("click", () => {
                const action = item.dataset.action;

                if (action === "dashboard") {
                    closeAllDrawers();
                    document.getElementById("dashboard-overview")?.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });
                } else if (action === "open-dataset") {
                    openDrawer("dataset");
                } else if (action === "open-glossary") {
                    openDrawer("glossary");
                }

                setActiveNavigation(action);

                if (window.innerWidth <= 820) {
                    toggleMobileSidebar(false);
                }
            });
        });

        elements["btn-close-dataset"]?.addEventListener("click", () => {
            closeAllDrawers();
            setActiveNavigation("dashboard");
        });

        elements["btn-close-glossary"]?.addEventListener("click", () => {
            closeAllDrawers();
            setActiveNavigation("dashboard");
        });

        elements["drawer-backdrop"]?.addEventListener("click", () => {
            closeAllDrawers();
            setActiveNavigation("dashboard");
        });

        elements["glossary-search"]?.addEventListener("input", filterGlossary);

        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape") {
                closeAllDrawers();
                setActiveNavigation("dashboard");
            }
        });

        if (elements["notification-button"] && elements["notification-menu"]) {
            elements["notification-button"].addEventListener("click", (event) => {
                event.stopPropagation();
                const willOpen = elements["notification-menu"].classList.contains("hidden");
                elements["notification-menu"].classList.toggle("hidden", !willOpen);
                elements["notification-button"].setAttribute("aria-expanded", String(willOpen));
            });

            document.addEventListener("click", (event) => {
                if (!event.target.closest(".notification-wrap")) {
                    elements["notification-menu"].classList.add("hidden");
                    elements["notification-button"].setAttribute("aria-expanded", "false");
                }
            });
        }
    }

    function toggleMobileSidebar(open) {
        if (!elements["sidebar"] || !elements["sidebar-overlay"]) return;
        elements["sidebar"].classList.toggle("mobile-open", open);
        elements["sidebar-overlay"].classList.toggle("visible", open);
        const drawerOpen =
            !elements["dataset-drawer"]?.classList.contains("hidden") ||
            !elements["glossary-drawer"]?.classList.contains("hidden");
        document.body.style.overflow = open || drawerOpen ? "hidden" : "";
    }

    function toggleSidebar() {
        if (window.innerWidth <= 820) {
            const isOpen = elements["sidebar"]?.classList.contains("mobile-open");
            toggleMobileSidebar(!isOpen);
            return;
        }

        document.body.classList.toggle("sidebar-collapsed");
        setTimeout(() => state.map?.invalidateSize(), 220);
    }

    function toggleKepriHighlight() {
        const nextState = !state.highlightAll;

        if (nextState) {
            clearSelectedZom();
        }

        state.highlightAll = nextState;
        updateHighlightButton();

        const bounds = state.geoJsonLayer?.getBounds();
        if (bounds && bounds.isValid()) {
            state.map.fitBounds(bounds, { padding: [8, 8], maxZoom: 8.75 });
        }

        state.layerByZom.forEach((layer, code) => applyLayerStyle(code, layer));
    }

    function updateHighlightButton() {
        elements["btn-fit-map"]?.classList.toggle("is-active", state.highlightAll);
        if (elements["btn-fit-map-label"]) {
            elements["btn-fit-map-label"].textContent = state.highlightAll
                ? "Tampilkan peta normal"
                : "Sorot Kepulauan Riau";
        }
        if (elements["map-active-zom"] && !state.selectedZom) {
            elements["map-active-zom"].textContent = state.highlightAll
                ? "Seluruh wilayah ZOM disorot"
                : "Peta dasar Kepulauan Riau";
        }
    }

    function openDrawer(type) {
        closeAllDrawers();
        const target = type === "glossary"
            ? elements["glossary-drawer"]
            : elements["dataset-drawer"];
        target?.classList.remove("hidden");
        elements["drawer-backdrop"]?.classList.remove("hidden");
        document.body.style.overflow = "hidden";

        if (type === "glossary") {
            setTimeout(() => elements["glossary-search"]?.focus(), 120);
        }
    }

    function closeAllDrawers() {
        elements["dataset-drawer"]?.classList.add("hidden");
        elements["glossary-drawer"]?.classList.add("hidden");
        elements["drawer-backdrop"]?.classList.add("hidden");
        if (!elements["sidebar"]?.classList.contains("mobile-open")) {
            document.body.style.overflow = "";
        }
    }

    function setActiveNavigation(action) {
        document.querySelectorAll(".nav-item[data-action]").forEach((item) => {
            item.classList.toggle("active", item.dataset.action === action);
        });
    }

    function filterGlossary() {
        const query = String(elements["glossary-search"]?.value || "")
            .trim()
            .toLowerCase();
        let visibleCount = 0;

        document.querySelectorAll(".glossary-item").forEach((item) => {
            const searchable = `${item.dataset.term || ""} ${item.textContent || ""}`.toLowerCase();
            const visible = !query || searchable.includes(query);
            item.classList.toggle("hidden", !visible);
            if (visible) visibleCount += 1;
        });

        elements["glossary-empty"]?.classList.toggle("hidden", visibleCount > 0);
    }

    function markResultStale() {
        if (!elements["result-section"].classList.contains("hidden")) {
            elements["match-status"].textContent =
                "Parameter berubah. Jalankan verifikasi ulang.";
            elements["match-status"].className = "match-status near";
        }
    }

    function toggleComplexMode(enabled) {
        document.querySelectorAll(".condition-input").forEach((select) => {
            select.disabled = enabled;
        });
    }

    function populateZomSelect() {
        ZOM_CODES.forEach((code) => {
            const option = document.createElement("option");
            option.value = code;
            option.textContent = displayZomLabel(code);
            elements["zom-select"].appendChild(option);
        });
    }

    function initMap() {
        state.map = L.map("map", {
            zoomControl: false,
            minZoom: 5,
            zoomSnap: 0.25,
            zoomDelta: 0.5
        }).setView([0.9167, 104.4667], 8);

        L.control.zoom({ position: "topright" }).addTo(state.map);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 18,
            attribution: "&copy; OpenStreetMap contributors"
        }).addTo(state.map);

        const geoJsonData = resolveGeoJsonData();

        if (!geoJsonData) {
            showMapNotice(
                "Batas ZOM belum dimuat. Pilih ZOM melalui daftar, atau pastikan zom_kepri.js memuat variabel dataZom."
            );
            return;
        }

        state.geoJsonLayer = L.geoJSON(geoJsonData, {
            style: defaultLayerStyle,
            onEachFeature: attachFeatureInteraction
        }).addTo(state.map);

        const bounds = state.geoJsonLayer.getBounds();
        if (bounds.isValid()) {
            state.map.fitBounds(bounds, { padding: [10, 10], maxZoom: 8.75 });
        }

        if (state.layerByZom.size === 0) {
            showMapNotice(
                "GeoJSON terbaca, tetapi kode ZOM belum cocok. Periksa NO_ZOM atau konfigurasi zomCodeMap."
            );
        }

        updateHighlightButton();
    }

    function resolveGeoJsonData() {
        const candidates = CONFIG.geoJsonVariableCandidates || [
            "dataZom",
            "zomKepri",
            "geojsonZom",
            "geoJsonZom"
        ];

        for (const variableName of candidates) {
            const candidate = window[variableName];
            if (candidate && candidate.type && candidate.features) {
                return candidate;
            }
        }

        return null;
    }

    function defaultLayerStyle(feature) {
        const code = extractZomCode(feature?.properties || {});
        const isKnown = Boolean(code && DATA[code]);

        return {
            fillColor: isKnown ? COLORS.base : COLORS.unavailable,
            fillOpacity: 0,
            color: COLORS.border,
            weight: 0,
            opacity: 0,
            dashArray: null,
            lineJoin: "round"
        };
    }

    function attachFeatureInteraction(feature, layer) {
        const code = extractZomCode(feature.properties || {});

        if (code && DATA[code]) {
            state.layerByZom.set(code, layer);
        }

        layer.on({
            click: () => {
                if (code && DATA[code]) {
                    selectZom(code, false, "peta");
                    layer.openPopup();
                }
            },
            mouseover: () => {
                const isSelected = code && code === state.selectedZom;
                layer.setStyle({
                    weight: isSelected ? 2.3 : 1.4,
                    color: isSelected ? COLORS.selectedBorder : "#4d86aa",
                    opacity: 1,
                    fillColor: COLORS.base,
                    fillOpacity: isSelected ? 0.12 : 0.07
                });
                layer.bringToFront();
            },
            mouseout: () => applyLayerStyle(code, layer)
        });

        layer.bindTooltip(buildLayerTooltip(code, null), {
            sticky: true,
            className: "zom-tooltip"
        });

        layer.bindPopup(buildFeaturePopup(code, feature.properties || {}), {
            className: "zom-popup",
            closeButton: true,
            autoPanPaddingTopLeft: [20, 20],
            autoPanPaddingBottomRight: [20, 20]
        });
    }

    function buildFeaturePopup(code, properties) {
        return `
            <div class="zom-popup-content">
                <span class="popup-kicker">Zona Musim</span>
                <strong>${escapeHtml(displayZomLabel(code) || "ZOM tidak dikenali")}</strong>
                <dl>
                    <div><dt>Tipe</dt><dd>${escapeHtml(properties.ZOM || "-")}</dd></div>
                    <div><dt>Awal MH</dt><dd>${escapeHtml(properties.AMH || "-")}</dd></div>
                    <div><dt>Awal MK</dt><dd>${escapeHtml(properties.AMK || "-")}</dd></div>
                </dl>
            </div>
        `;
    }

    function extractZomCode(properties) {
        const candidates = CONFIG.zomPropertyCandidates || ["NO_ZOM", "GRIDCODE", "ID"];
        let rawValue = null;

        for (const propertyName of candidates) {
            if (
                Object.prototype.hasOwnProperty.call(properties, propertyName) &&
                properties[propertyName] !== null &&
                properties[propertyName] !== ""
            ) {
                rawValue = properties[propertyName];
                break;
            }
        }

        if (rawValue === null) {
            return null;
        }

        const mapping = CONFIG.zomCodeMap || {};
        const mappingKey = String(rawValue).trim();
        if (mapping[mappingKey]) {
            return mapping[mappingKey];
        }

        return normalizeZomCode(rawValue);
    }

    function normalizeZomCode(value) {
        const text = String(value).trim().toUpperCase();

        if (DATA[text]) {
            return text;
        }

        const kepriMatch = text.match(/KEPRI[\s_-]*(\d{1,2})/);
        if (kepriMatch) {
            const candidate = `KEPRI_${kepriMatch[1].padStart(2, "0")}`;
            return DATA[candidate] ? candidate : null;
        }

        const numericMatch = text.match(/\d+/);
        if (numericMatch) {
            const candidate = `KEPRI_${numericMatch[0].padStart(2, "0")}`;
            return DATA[candidate] ? candidate : null;
        }

        return null;
    }

    function selectZom(code, zoomToLayer, source = "peta") {
        if (!code || !DATA[code]) {
            return;
        }

        const previousLayer = state.selectedLayer;

        if (state.highlightAll) {
            state.highlightAll = false;
            updateHighlightButton();
        }

        state.selectedZom = code;
        state.selectedLayer = state.layerByZom.get(code) || null;
        elements["zom-select"].value = code;
        updateSelectedZomStatus(code, source);

        if (elements["header-active-zom"]) {
            elements["header-active-zom"].textContent = displayZomLabel(code);
        }
        if (elements["map-active-zom"]) {
            elements["map-active-zom"].textContent = `${displayZomLabel(code)} terpilih`;
        }

        if (previousLayer && previousLayer !== state.selectedLayer) {
            const previousCode = findCodeByLayer(previousLayer);
            applyLayerStyle(previousCode, previousLayer);
            previousLayer.setTooltipContent(
                buildLayerTooltip(previousCode, state.analysisByZom.get(previousCode))
            );
        }

        state.layerByZom.forEach((layer, layerCode) => applyLayerStyle(layerCode, layer));

        if (state.selectedLayer) {
            state.selectedLayer.setTooltipContent(
                buildLayerTooltip(code, state.analysisByZom.get(code))
            );
            state.selectedLayer.bringToFront();

            if (zoomToLayer) {
                const bounds = state.selectedLayer.getBounds();
                if (bounds && bounds.isValid()) {
                    state.map.fitBounds(bounds, {
                        paddingTopLeft: [30, 30],
                        paddingBottomRight: [30, 30],
                        maxZoom: 10
                    });
                }
            }
        }

        if (state.latestInput) {
            renderSelectedZomResult();
        }
    }

    function clearSelectedZom() {
        state.map?.closePopup();
        state.selectedZom = "";
        state.selectedLayer = null;

        if (elements["zom-select"]) {
            elements["zom-select"].value = "";
        }
        if (elements["header-active-zom"]) {
            elements["header-active-zom"].textContent = "Belum dipilih";
        }
        if (elements["selected-zom-status"]) {
            elements["selected-zom-status"].classList.remove("active");
            elements["selected-zom-status"].innerHTML = `
                <span class="selection-dot" aria-hidden="true"></span>
                <span>Belum ada ZOM terpilih</span>
            `;
        }

        elements["result-section"]?.classList.add("hidden");
        elements["empty-state"]?.classList.remove("hidden");
        const emptyTitle = elements["empty-state"]?.querySelector("h3");
        const emptyText = elements["empty-state"]?.querySelector("p");
        if (emptyTitle) emptyTitle.textContent = "Belum ada ZOM terpilih";
        if (emptyText) emptyText.textContent = "Pilih ZOM pada peta atau melalui daftar.";
    }

    function updateSelectedZomStatus(code, source) {
        const status = elements["selected-zom-status"];
        status.classList.add("active");
        status.innerHTML = `
            <span class="selection-dot" aria-hidden="true"></span>
            <span><strong>${escapeHtml(displayZomLabel(code))}</strong> · ${escapeHtml(source)}</span>
        `;
    }

    function displayZomLabel(code) {
        if (!code) return "-";
        const match = String(code).match(/(\d{1,2})$/);
        if (match) {
            return `ZOM ${match[1].padStart(2, "0")}`;
        }
        return String(code).replace("KEPRI", "ZOM").replace("_", " ");
    }

    function findCodeByLayer(targetLayer) {
        for (const [code, layer] of state.layerByZom.entries()) {
            if (layer === targetLayer) {
                return code;
            }
        }
        return null;
    }

    function getInputConditions() {
        if (elements["input-complex"].checked) {
            return {
                complex: true,
                forecastRainfall: parseOptionalRainfall(elements["input-forecast-rain"]?.value)
            };
        }

        return {
            complex: false,
            enso: elements["input-enso"].value || null,
            iod: elements["input-iod"].value || null,
            sst: elements["input-sst"].value || null,
            itcz: elements["input-itcz"].value || "tidak-tercantum",
            mjo: elements["input-mjo"].value || "tidak-tercantum",
            monsun: elements["input-monsun"].value || "tidak-tercantum",
            forecastRainfall: parseOptionalRainfall(elements["input-forecast-rain"]?.value)
        };
    }

    function runAnalysis() {
        if (!state.selectedZom) {
            showInlineError("Pilih satu ZOM pada peta atau daftar terlebih dahulu.");
            return;
        }

        const conditions = getInputConditions();
        if (conditions.forecastRainfall?.invalid) {
            showInlineError("Nilai prediksi curah hujan harus berupa angka nol atau lebih besar dari nol.");
            return;
        }

        const missingRequired = conditions.complex
            ? []
            : REQUIRED_KEYS.filter((key) => !conditions[key]);

        if (missingRequired.length > 0) {
            showInlineError(
                "Pilih kondisi ENSO, IOD, dan SST lokal sebelum menjalankan verifikasi."
            );
            return;
        }

        state.latestInput = conditions;
        state.analysisByZom.clear();
        state.relatedVisible = false;

        ZOM_CODES.forEach((code) => {
            state.analysisByZom.set(code, analyzeZom(code, conditions));
        });

        updateMapFromAnalysis();
        renderSelectedZomResult();
    }

    function analyzeZom(code, conditions) {
        const allRows = DATA[code] || [];

        if (conditions.complex) {
            const exactRow = allRows.find((row) => row.kompleks) || null;
            return {
                exactRow,
                relatedRows: [],
                targetCombination: "Kombinasi Kompleks (>5 Fenomena)",
                complexMode: true
            };
        }

        const rows = allRows.filter((row) => !row.kompleks);
        const exactRow = rows.find((row) => isStrictExactMatch(row.fitur, conditions)) || null;
        const relatedRows = findRelatedRows(rows, conditions, exactRow);

        return {
            exactRow,
            relatedRows,
            targetCombination: buildTargetCombination(conditions),
            complexMode: false
        };
    }

    function isStrictExactMatch(features, conditions) {
        return FEATURE_KEYS.every((key) => features?.[key] === conditions[key]);
    }

    function findRelatedRows(rows, conditions, exactRow) {
        const totalWeight = FEATURE_KEYS.reduce(
            (sum, key) => sum + (FEATURE_WEIGHTS[key] || 1),
            0
        );

        return rows
            .filter((row) => !exactRow || row.kombinasi !== exactRow.kombinasi)
            .map((row) => {
                let matchedWeight = 0;
                let differenceCount = 0;

                FEATURE_KEYS.forEach((key) => {
                    if (row.fitur?.[key] === conditions[key]) {
                        matchedWeight += FEATURE_WEIGHTS[key] || 1;
                    } else {
                        differenceCount += 1;
                    }
                });

                return {
                    ...row,
                    skorKemiripan: Math.round((matchedWeight / totalWeight) * 100),
                    jumlahPerbedaan: differenceCount,
                    deskripsiPerbedaan: buildDifferenceDescription(conditions, row.fitur)
                };
            })
            .sort((a, b) => {
                if (a.jumlahPerbedaan !== b.jumlahPerbedaan) {
                    return a.jumlahPerbedaan - b.jumlahPerbedaan;
                }
                if (b.skorKemiripan !== a.skorKemiripan) {
                    return b.skorKemiripan - a.skorKemiripan;
                }
                return Number(b.n || 0) - Number(a.n || 0);
            })
            .slice(0, 5);
    }

    function buildDifferenceDescription(expected, actual) {
        const differences = FEATURE_KEYS
            .filter((key) => expected[key] !== actual?.[key])
            .map((key) => {
                const from = SHORT_LABELS[key]?.[expected[key]] || String(expected[key] ?? "-");
                const to = SHORT_LABELS[key]?.[actual?.[key]] || String(actual?.[key] ?? "-");
                return `${from} → ${to}`;
            });

        return differences.length > 0 ? differences.join("; ") : "Tidak ada perbedaan";
    }

    function buildTargetCombination(conditions) {
        const parts = [];

        if (conditions.itcz === "aktif") {
            parts.push("ITCZ Aktif");
        }

        const ensoText = {
            "el-nino": "El Nino",
            "la-nina": "La Nina",
            netral: "ENSO Netral"
        }[conditions.enso];
        if (ensoText) parts.push(ensoText);

        const iodText = {
            positif: "IOD(+)",
            negatif: "IOD(-)",
            netral: "IOD Netral"
        }[conditions.iod];
        if (iodText) parts.push(iodText);

        if (conditions.mjo === "indo") {
            parts.push("MJO Indo");
        }

        if (conditions.monsun === "asia") {
            parts.push("Monsun Asia");
        } else if (conditions.monsun === "australia") {
            parts.push("Monsun Aus");
        }

        const sstText = {
            positif: "SST Lokal(+)",
            negatif: "SST Lokal(-)",
            netral: "SST Lokal Netral"
        }[conditions.sst];
        if (sstText) parts.push(sstText);

        return parts.join(" + ");
    }

    function updateMapFromAnalysis() {
        state.layerByZom.forEach((layer, code) => {
            applyLayerStyle(code, layer);
            layer.setTooltipContent(buildLayerTooltip(code, state.analysisByZom.get(code)));
        });
    }

    function applyLayerStyle(code, layer) {
        if (!layer) return;

        const isSelected = Boolean(code && code === state.selectedZom);

        if (isSelected) {
            layer.setStyle({
                fillColor: "#3a7ca5",
                fillOpacity: 0.11,
                color: "#e07a2f",
                weight: 2.3,
                opacity: 1,
                dashArray: null,
                lineJoin: "round"
            });
            layer.bringToFront();
            return;
        }

        if (state.highlightAll) {
            layer.setStyle({
                fillColor: "#4d9bc3",
                fillOpacity: 0.1,
                color: "#356a8c",
                weight: 1.2,
                opacity: 0.92,
                dashArray: null,
                lineJoin: "round"
            });
            return;
        }

        layer.setStyle({
            fillColor: "#4d9bc3",
            fillOpacity: 0,
            color: "#34506a",
            weight: 0,
            opacity: 0,
            dashArray: null,
            lineJoin: "round"
        });
    }

    function buildLayerTooltip(code, analysis) {
        if (!code) {
            return "<strong>ZOM tidak dikenali</strong><br>Periksa pemetaan kode pada config.js.";
        }

        const selectedText = code === state.selectedZom
            ? '<br><span class="tooltip-selected">ZOM terpilih</span>'
            : '<br><span class="tooltip-hint">Klik untuk memilih</span>';

        if (!analysis) {
            return `<strong>${escapeHtml(displayZomLabel(code))}</strong>${selectedText}<br>Belum diverifikasi`;
        }

        if (!analysis.exactRow) {
            return `<strong>${escapeHtml(displayZomLabel(code))}</strong>${selectedText}<br>Kombinasi persis tidak ditemukan`;
        }

        const row = analysis.exactRow;
        return `
            <strong>${escapeHtml(displayZomLabel(code))}</strong>${selectedText}<br>
            Kombinasi persis ditemukan<br>
            n = ${formatInteger(row.n)}<br>
            Kering: ${formatPercent(row.probKering)}<br>
            Basah: ${formatPercent(row.probBasah)}<br>
            Dampak: ${formatMm(row.rerataDampakMm, true)}
        `;
    }

    function renderSelectedZomResult() {
        const analysis = state.analysisByZom.get(state.selectedZom);

        if (!analysis) {
            showInlineError("Hasil verifikasi tidak tersedia untuk ZOM ini.");
            return;
        }

        elements["empty-state"].classList.add("hidden");
        elements["result-section"].classList.remove("hidden");
        elements["related-section"].classList.add("hidden");
        elements["btn-toggle-related"].textContent = "Lihat kombinasi terkait";
        state.relatedVisible = false;

        renderConditionChips(state.latestInput);
        renderRelatedRows(analysis.relatedRows);
        elements["btn-toggle-related"].classList.toggle(
            "hidden",
            analysis.complexMode || analysis.relatedRows.length === 0
        );

        if (analysis.exactRow) {
            renderExactResult(state.selectedZom, analysis.exactRow);
        } else {
            renderNoExactResult(analysis.targetCombination);
        }

        elements["result-section"].scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }

    function renderExactResult(code, row) {
        const category = categoryFromRow(row);
        const categoryMeta = getCategoryMeta(category);

        elements["match-status"].className = "match-status exact";
        elements["match-status"].textContent = "Kecocokan persis ditemukan.";

        elements["exact-result-content"].classList.remove("hidden");
        elements["no-exact-content"].classList.add("hidden");

        elements["result-zom"].textContent = displayZomLabel(code);
        elements["category-badge"].textContent = categoryMeta.label;
        elements["category-badge"].className = `category-badge ${category}`;
        elements["exact-combination-name"].textContent = row.kombinasi;

        elements["prob-dry"].textContent = formatPercent(row.probKering);
        elements["prob-wet"].textContent = formatPercent(row.probBasah);
        elements["prob-dry-bar"].style.width = clamp(row.probKering, 0, 100) + "%";
        elements["prob-wet-bar"].style.width = clamp(row.probBasah, 0, 100) + "%";

        elements["mean-impact"].textContent = formatMm(row.rerataDampakMm, true);
        elements["total-events"].textContent = formatInteger(row.n);
        elements["evidence-level"].textContent = evidenceLevel(row.n);
        elements["dry-impact"].textContent = formatMm(row.dampakKeringMm);
        elements["wet-impact"].textContent = formatMm(row.dampakBasahMm, true);
        elements["min-anomaly"].textContent = formatMm(row.minAnomaliMm);
        elements["max-anomaly"].textContent = formatMm(row.maxAnomaliMm, true);

        renderForecastAccuracy(row);
        renderInterpretation(code, row, category);
    }

    function renderNoExactResult(targetCombination) {
        elements["match-status"].className = "match-status weak";
        elements["match-status"].textContent = "Kombinasi persis tidak ditemukan.";

        elements["exact-result-content"].classList.add("hidden");
        elements["no-exact-content"].classList.remove("hidden");
        hideForecastAccuracy();
        elements["target-combination-name"].textContent = targetCombination || "-";
    }

    function renderConditionChips(conditions) {
        const container = elements["selected-conditions"];
        container.innerHTML = "";

        if (conditions.complex) {
            const chip = document.createElement("span");
            chip.className = "condition-chip complex";
            chip.textContent = "Kombinasi Kompleks (>5 Fenomena)";
            container.appendChild(chip);
            return;
        }

        FEATURE_KEYS.forEach((key) => {
            const value = conditions[key];
            const chip = document.createElement("span");
            chip.className = value === "tidak-tercantum"
                ? "condition-chip absent"
                : "condition-chip";
            chip.textContent = FEATURE_LABELS[key]?.[value] || `${key}: ${value}`;
            container.appendChild(chip);
        });
    }

    function renderRelatedRows(rows) {
        const container = elements["related-combinations"];
        container.innerHTML = "";
        elements["related-note"].textContent = `${rows.length} alternatif terdekat`;

        rows.forEach((row, index) => {
            const category = categoryFromRow(row);
            const item = document.createElement("article");
            item.className = "combination-item";
            item.innerHTML = `
                <div class="combination-topline">
                    <span class="rank-number">${index + 1}</span>
                    <div class="combination-name">${escapeHtml(row.kombinasi)}</div>
                </div>
                <div class="difference-line">
                    <strong>Perbedaan:</strong> ${escapeHtml(row.deskripsiPerbedaan)}
                </div>
                <div class="combination-meta">
                    <span>${row.jumlahPerbedaan} perbedaan</span>
                    <span>Kemiripan ${formatInteger(row.skorKemiripan)}%</span>
                    <span>n = ${formatInteger(row.n)}</span>
                    <span class="meta-category ${category}">${getCategoryMeta(category).label}</span>
                    <span>Kering ${formatPercent(row.probKering)}</span>
                    <span>Basah ${formatPercent(row.probBasah)}</span>
                    <span>Dampak ${formatMm(row.rerataDampakMm, true)}</span>
                </div>
            `;
            container.appendChild(item);
        });
    }

    function toggleRelated() {
        if (elements["result-section"].classList.contains("hidden")) return;

        state.relatedVisible = !state.relatedVisible;
        elements["related-section"].classList.toggle("hidden", !state.relatedVisible);
        elements["btn-toggle-related"].textContent = state.relatedVisible
            ? "Sembunyikan kombinasi terkait"
            : "Lihat kombinasi terkait";

        if (state.relatedVisible) {
            elements["related-section"].scrollIntoView({
                behavior: "smooth",
                block: "nearest"
            });
        }
    }


    function parseOptionalRainfall(value) {
        const text = String(value ?? "").trim();

        if (!text) {
            return {
                active: false,
                value: null,
                invalid: false
            };
        }

        const normalized = text.replace(",", ".");
        const number = Number(normalized);

        return {
            active: true,
            value: number,
            invalid: !Number.isFinite(number) || number < 0
        };
    }

    function renderForecastAccuracy(row) {
        const section = elements["forecast-accuracy-section"];
        const forecast = state.latestInput?.forecastRainfall;

        if (!section || !forecast?.active || forecast.invalid) {
            hideForecastAccuracy();
            return;
        }

        const referenceValue = Number(row?.rerataDampakMm);

        if (!Number.isFinite(referenceValue)) {
            hideForecastAccuracy();
            return;
        }

        const forecastValue = forecast.value;
        const absoluteError = Math.abs(forecastValue - referenceValue);
        const denominator = Math.max(Math.abs(referenceValue), 1);
        const relativeAccuracy = clamp(
            100 - (absoluteError / denominator) * 100,
            0,
            100
        );

        section.classList.remove("hidden");
        elements["forecast-value"].textContent = formatMm(forecastValue);
        elements["historical-reference-value"].textContent = formatMm(referenceValue, true);
        elements["forecast-absolute-error"].textContent = formatMm(absoluteError);
        elements["forecast-accuracy-value"].textContent = formatPercent(relativeAccuracy);
        elements["forecast-accuracy-note"].textContent =
            "Akurasi dihitung secara relatif terhadap rerata dampak historis pada kombinasi yang sama. Nilai ini bersifat pendukung dan tidak mengubah hasil verifikasi historis.";
    }

    function hideForecastAccuracy() {
        elements["forecast-accuracy-section"]?.classList.add("hidden");
    }

    function renderInterpretation(code, row, category) {
        const evidence = evidenceLevel(row.n).toLowerCase();
        let text;

        if (category === "dry") {
            text = `Kombinasi ini menunjukkan kecenderungan kering pada ${displayZomLabel(code)}. Probabilitas kering sebesar ${formatPercent(row.probKering)} dengan rerata dampak ${formatMm(row.rerataDampakMm, true)}.`;
        } else if (category === "wet") {
            text = `Kombinasi ini menunjukkan kecenderungan basah pada ${displayZomLabel(code)}. Probabilitas basah sebesar ${formatPercent(row.probBasah)} dengan rerata dampak ${formatMm(row.rerataDampakMm, true)}.`;
        } else {
            text = `Kombinasi ini menunjukkan respons historis yang seimbang pada ${displayZomLabel(code)}. Peluang kering dan basah tidak melewati batas kategori 55%.`;
        }

        text += ` Kekuatan bukti tergolong ${evidence} berdasarkan ${formatInteger(row.n)} kejadian historis.`;
        elements["interpretation-box"].style.borderLeftColor = COLORS[category];
        elements["interpretation-box"].textContent = text;
    }

    function categoryFromRow(row) {
        const categoryText = String(row?.kategori || "").toUpperCase();
        if (categoryText.includes("KERING")) return "dry";
        if (categoryText.includes("BASAH")) return "wet";
        return "balanced";
    }

    function showInlineError(message) {
        elements["empty-state"].classList.remove("hidden");
        elements["result-section"].classList.add("hidden");
        elements["empty-state"].querySelector("h3").textContent =
            "Verifikasi belum dapat dijalankan";
        elements["empty-state"].querySelector("p").textContent = message;
    }

    function resetConditions() {
        elements["input-enso"].value = "";
        elements["input-iod"].value = "";
        elements["input-sst"].value = "";
        elements["input-itcz"].value = "tidak-tercantum";
        elements["input-mjo"].value = "tidak-tercantum";
        elements["input-monsun"].value = "tidak-tercantum";
        if (elements["input-forecast-rain"]) {
            elements["input-forecast-rain"].value = "";
        }
        elements["input-complex"].checked = false;
        toggleComplexMode(false);

        state.latestInput = null;
        state.analysisByZom.clear();
        state.relatedVisible = false;

        elements["empty-state"].classList.remove("hidden");
        elements["result-section"].classList.add("hidden");
        elements["empty-state"].querySelector("h3").textContent = "Belum ada hasil";
        elements["empty-state"].querySelector("p").textContent =
            "Pilih parameter dan jalankan verifikasi.";
        hideForecastAccuracy();

        state.layerByZom.forEach((layer, code) => {
            applyLayerStyle(code, layer);
            layer.setTooltipContent(buildLayerTooltip(code, null));
        });
    }

    function collapsePanel() {
        elements["control-panel"].classList.add("hidden");
        elements["verification-workspace"]?.classList.add("is-collapsed");
        elements["content-grid"]?.classList.add("panel-collapsed");
        elements["btn-open-panel"].classList.remove("hidden");
        setTimeout(() => state.map?.invalidateSize(), 180);
    }

    function openPanel() {
        elements["control-panel"].classList.remove("hidden");
        elements["verification-workspace"]?.classList.remove("is-collapsed");
        elements["content-grid"]?.classList.remove("panel-collapsed");
        elements["btn-open-panel"].classList.add("hidden");
        setTimeout(() => state.map?.invalidateSize(), 180);
    }

    function showMapNotice(message) {
        elements["map-data-notice"].textContent = message;
        elements["map-data-notice"].classList.remove("hidden");
    }

    function getCategoryMeta(category) {
        if (category === "dry") return { label: "Kering" };
        if (category === "wet") return { label: "Basah" };
        return { label: "Seimbang" };
    }

    function evidenceLevel(totalN) {
        const n = Number(totalN || 0);
        if (n >= 30) return "Kuat";
        if (n >= 15) return "Cukup";
        if (n >= 5) return "Terbatas";
        return "Sangat terbatas";
    }

    function isFiniteNumber(value) {
        return value !== null && value !== "" && Number.isFinite(Number(value));
    }

    function formatPercent(value) {
        if (!isFiniteNumber(value)) return "-";
        return Number(value).toLocaleString("id-ID", {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
        }) + "%";
    }

    function formatMm(value, showPlus = false) {
        if (!isFiniteNumber(value)) return "-";
        const number = Number(value);
        const sign = showPlus && number > 0 ? "+" : "";
        return sign + number.toLocaleString("id-ID", {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
        }) + " mm";
    }

    function formatInteger(value) {
        if (!isFiniteNumber(value)) return "-";
        return Math.round(Number(value)).toLocaleString("id-ID");
    }

    function clamp(value, min, max) {
        return Math.min(Math.max(Number(value) || 0, min), max);
    }

    function escapeHtml(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }
})();
