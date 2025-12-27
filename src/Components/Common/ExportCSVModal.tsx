import PropTypes from "prop-types";
import React from "react";
import { Modal, ModalBody, ModalHeader } from "reactstrap";
import * as XLSX from "xlsx";

interface ExportCSVModalProps {
  show: boolean;
  onCloseClick: () => void;
  data: any;
}

const ExportCSVModal = ({ show, onCloseClick, data } : ExportCSVModalProps) => {
  const handleExportToExcel = () => {
    // Crear un nuevo libro de trabajo
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
    
    // Generar el archivo y descargarlo
    XLSX.writeFile(workbook, `export_${new Date().getTime()}.xlsx`);
    
    // Cerrar el modal
    onCloseClick();
  };

  return (
    <Modal isOpen={show} toggle={onCloseClick} centered={true}>
        <ModalHeader toggle={onCloseClick}></ModalHeader>
          <ModalBody className="py-3 px-5">
          <div className="mt-2 text-center">
              <i className="ri-file-excel-line display-5 text-success"></i>

              <div className="mt-4 pt-2 fs-15 mx-4 mx-sm-5">
                  <h4>Are you sure ?</h4>
                  <p className="text-muted mx-4 mb-0">
                      Are you sure you want to export Excel file?
                  </p>
                  </div>
              </div>
              <div className="d-flex gap-2 justify-content-center mt-4 mb-2">
              <button
                  type="button"
                  className="btn w-sm btn-light"
                  data-bs-dismiss="modal"
                  onClick={onCloseClick}
              >
                  Close
              </button>
              <button
                  type="button"
                  onClick={handleExportToExcel}
                  className="btn w-sm btn-success "
                  id="export-excel"
              >
                  Download
              </button>
              </div>
      </ModalBody>
    </Modal>
  );
};

ExportCSVModal.propTypes = {
  onCloseClick: PropTypes.func,
  data: PropTypes.any,
  show: PropTypes.any,
};

export default ExportCSVModal;