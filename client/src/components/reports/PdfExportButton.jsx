// client/src/components/reports/PdfExportButton.jsx
import React from "react";

function PdfExportButton() {
    const handleExport = () => {
        // Oddiy variant: brauzerning Print -> Save as PDF funksiyasidan foydalanganda
        window.print();
    };

    return (
        <button
            type="button"
            className="button-primary"
            style={{
                boxShadow: "none",
                paddingInline: 14,
                fontSize: 13,
            }}
            onClick={handleExport}
        >
            PDF hisobot
        </button>
    );
}

export default PdfExportButton;
