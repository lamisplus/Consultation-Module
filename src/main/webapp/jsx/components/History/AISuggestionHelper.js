import React, { useState } from "react";
import { Modal, Form, Badge, Alert } from "react-bootstrap";
import { Button, Icon } from "semantic-ui-react";
import axios from "axios";
import { toast } from "react-toastify";
import { audioTranscriptionUrl } from "../../../api";

const AISuggestionHelper = ({ soapNote, type, onCreate }) => {
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [selectedItems, setSelectedItems] = useState([]);

    
    const config = {
        diagnosis: {
            url: `${audioTranscriptionUrl}/icd/diagnoses`,
            resultKey: "diagnosis_codes",
            label: "Clinical Diagnoses",
            btnClass: "btn-primary",
        },
        symptoms: {
            url: `${audioTranscriptionUrl}/icd/symptoms`,
            resultKey: "symptom_codes",
            label: "Presenting Complaints",
            btnClass: "btn-info",
        },
    };

    const currentConfig = config[type];

    const handleFetchSuggestions = () => {
        if (!soapNote || soapNote.length < 10) {
            toast.error(`Please enter a detailed visit note before asking AI for ${currentConfig.label}.`);
            return;
        }

        setLoading(true);

        axios
            .post(
                currentConfig.url,
                { soap_text: soapNote },
            )
            .then((response) => {
                const results = response.data[currentConfig.resultKey];
                if (results && results.length > 0) {
                    setSuggestions(results);
                    setSelectedItems([]);
                    setShowModal(true);
                } else {
                    toast.info("AI could not find any relevant codes based on the note.");
                }
                setLoading(false);
            })
            .catch((error) => {
                setLoading(false);
                console.error(error);
                toast.error("Failed to fetch AI suggestions. Please try again.");
            });
    };

    const toggleSelection = (item) => {
        const isSelected = selectedItems.find((i) => i.code === item.code);
        if (isSelected) {
            setSelectedItems(selectedItems.filter((i) => i.code !== item.code));
        } else {
            setSelectedItems([...selectedItems, item]);
        }
    };

    const handleConfirm = () => {
        const formattedData = selectedItems.map((item) => ({
            code: item.code,
            name: item.title,
            title: item.title,
            system: "ICD-11",
            reasoning: item.reasoning
        }));

        onCreate(formattedData);
        setShowModal(false);
        toast.success(`${selectedItems.length} items added successfully.`);
    };

    return (
        <>
            <Button
                color="violet"
                title="Suggest ICD-11 diagnosis codes from Patient's Visit Note"
                size="tiny"
                type="button"
                onClick={handleFetchSuggestions}
                disabled={loading}
            >
                {loading ? (
                    <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Loading...
                    </>
                ) : (
                    <>
                        <Icon name="magic" />  AI Suggest {currentConfig?.label === "Presenting Complaints" ? "Complaint ICD Codes" : "Symptoms ICD Codes"}
                    </>
                )}
            </Button>


            <Modal
                show={showModal}
                onHide={() => setShowModal(false)}
                size="lg"
                contentClassName="rounded-0 border-0 shadow-lg"
                centered
                scrollable
            >
                <Modal.Header closeButton className="border-bottom-0 pb-0 bg-white rounded-0">
                    <div>
                        <Modal.Title className="h5 fw-bold text-dark">
                            <Icon name="magic" className="text-violet me-2" />
                            AI Suggested {currentConfig.label}
                        </Modal.Title>
                        <p className="text-muted small mb-2 mt-1">
                            Select the codes you wish to apply to the patient chart.
                        </p>
                    </div>
                </Modal.Header>

                <Modal.Body className="p-0 bg-white">
                    {/* Top alert, streamlined */}
                    <div className="px-4 pt-3 pb-2">
                        <Alert variant="light" className="d-flex align-items-center border rounded-0 py-2 small text-muted">
                            <Icon name="info circle" className="me-2" />
                            <span>Based on the SOAP note analysis, the following codes were extracted.</span>
                        </Alert>
                    </div>

                    {/* Clean List Layout */}
                    <div className="list-group list-group-flush border-top">
                        {suggestions.map((item, index) => {
                            const isSelected = selectedItems.some((i) => i.code === item.code);

                            return (
                                <div
                                    key={index}
                                    onClick={() => toggleSelection(item)}
                                    className={`list-group-item list-group-item-action p-3 border-bottom`}
                                    style={{
                                        cursor: "pointer",
                                        backgroundColor: isSelected ? "#f0f7ff" : "white", // Subtle blue highlight when selected
                                        borderLeft: isSelected ? "4px solid #6435c9" : "4px solid transparent", // Semantic UI Violet hex
                                        transition: "all 0.1s ease-in-out"
                                    }}
                                >
                                    <div className="d-flex w-100 justify-content-between align-items-start">
                                        {/* Left Side: Checkbox + Content */}
                                        <div className="d-flex gap-3">
                                            <div className="pt-1">
                                                <Form.Check
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    readOnly
                                                    style={{ transform: "scale(1.1)", cursor: "pointer" }}
                                                />
                                            </div>

                                            <div>
                                                <div className="d-flex align-items-center mb-1">
                                                    <span className="badge bg-light text-dark border rounded-0 me-2" style={{ fontFamily: 'monospace', fontSize: '0.9em' }}>
                                                        {item.code}
                                                    </span>
                                                    <span className={`fw-bold ${isSelected ? "text-primary" : "text-dark"}`}>
                                                        {item.title}
                                                    </span>
                                                </div>

                                                {/* Reasoning - Clean text block */}
                                                <div className="text-secondary small" style={{ lineHeight: '1.4' }}>
                                                    {item.reasoning}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Side: Confidence Score */}
                                        {/* {item.score && (
                                            <div className="text-end ps-3" style={{ minWidth: '80px' }}>
                                                 <small className="text-muted d-block text-uppercase" style={{fontSize: '0.65rem'}}>Distance</small>
                                                 <span className={`fw-bold ${item.score > 80 ? 'text-success' : 'text-warning'}`}>
                                                     {item.score}
                                                 </span>
                                            </div>
                                        )} */}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Modal.Body>

                <Modal.Footer className="bg-light border-top rounded-0 py-2">
                    <div className="d-flex justify-content-between align-items-center w-100">
                        <div className="text-muted small">
                            <Icon name="check circle outline" />
                            <strong>{selectedItems.length}</strong> items selected
                        </div>
                        <div className="d-flex gap-2">
                            <Button
                                basic
                                color="grey"
                                size="small"
                                onClick={() => setShowModal(false)}
                                className="rounded-0 shadow-none"
                            >
                                Cancel
                            </Button>
                            <Button
                                color="violet"
                                size="small"
                                onClick={handleConfirm}
                                disabled={selectedItems.length === 0}
                                className="rounded-0 shadow-none"
                            >
                                <Icon name="plus" /> Accept Selected
                            </Button>
                        </div>
                    </div>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default AISuggestionHelper;