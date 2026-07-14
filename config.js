window.DASHBOARD_CONFIG = {
    // Nama variabel GeoJSON yang akan dicari pada zom_kepri.js.
    geoJsonVariableCandidates: [
        "dataZom",
        "zomKepri",
        "geojsonZom",
        "geoJsonZom",
        "zom_kepri"
    ],

    // Nama properti yang mungkin menyimpan kode ZOM di GeoJSON.
    zomPropertyCandidates: [
        "NO_ZOM",
        "GRIDCODE",
        "ID"
    ],

    /*
     * Isi pemetaan ini jika kode pada GeoJSON tidak sama dengan KEPRI_01 sampai KEPRI_14.
     * Contoh:
     * zomCodeMap: {
     *     "401": "KEPRI_01",
     *     "402": "KEPRI_02"
     * }
     */
    zomCodeMap: {}
};
