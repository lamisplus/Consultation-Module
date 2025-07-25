import React, { useState, useEffect } from "react";
import { Modal, Button } from "react-bootstrap";
import { Step, Label, Segment, Icon } from "semantic-ui-react";
import { Form, Row, Card, CardBody, Spinner } from "reactstrap";
import DualListBox from "react-dual-listbox";
import { makeStyles } from "@material-ui/core/styles";
import axios from "axios";
import { toast } from "react-toastify";
import { url as baseUrl, token } from "../../../api";
import { useHistory } from "react-router-dom";
import MatButton from "@material-ui/core/Button";
import SaveIcon from "@material-ui/icons/Save";
import ExitToAppIcon from "@material-ui/icons/ExitToApp";
import { format } from "date-fns";
import "react-dual-listbox/lib/react-dual-listbox.css";

const useStyles = makeStyles((theme) => ({
  card: {
    margin: theme.spacing(20),
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  form: {
    width: "100%", // Fix IE 11 issue.
    marginTop: theme.spacing(3),
  },
  submit: {
    margin: theme.spacing(3, 0, 2),
  },
  cardBottom: {
    marginBottom: 20,
  },
  Select: {
    height: 45,
    width: 350,
  },
  button: {
    margin: theme.spacing(1),
  },

  root: {
    "& > *": {
      margin: theme.spacing(1),
    },
  },
  input: {
    display: "none",
  },
  error: {
    color: "#f85032",
    fontSize: "11px",
  },
  success: {
    color: "#4BB543 ",
    fontSize: "11px",
  },
}));

const PostClient = (props) => {
  const patientObj = props.patientObj;

  let newDate = new Date();
  const [selectedOption, setSelectedOption] = useState([]);
  let history = useHistory();
  const classes = useStyles();
  const [services, setServices] = useState([]);
  const [saving, setSaving] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [showCheckoutConfirm, setShowCheckoutConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [postServices, setPostServices] = useState({
    encounterDate: format(new Date(newDate), "yyyy-MM-dd"),
    facilityId: patientObj.facilityId,
    personId: "",
    serviceCode: "",
    visitId: "",
  });

  async function ServicesPost() {
    axios
      .get(`${baseUrl}opd-setting`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        let data = response.data.filter(
          (a) =>
            a.moduleServiceName.toUpperCase() !== "TRIAGE" &&
            a.moduleServiceName.toUpperCase() !== "CONSULTATION"
        );

        setServices(
          Object.entries(data).map(([key, value]) => ({
            label: value.moduleServiceName,
            value: value.moduleServiceCode,
          }))
        );
      })
      .catch((error) => {});
  }

  useEffect(() => {
    ServicesPost();
  }, []);

  // Post patient to services only 
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedOption.length > 0) {
      setSaving(true);

      try {
     
        // await axios.put(
        //   `${baseUrl}patient/visit/checkout/${patientObj.visitId}`,
        //   patientObj.visitId,
        //   {
        //     headers: { Authorization: `Bearer ${token}` },
        //   }
        // );

        let serviceArr = [];
        selectedOption.forEach(function (value, index, array) {
          serviceArr.push(value);
        });

        postServices.personId = patientObj.id;
        postServices.visitId = patientObj.visitId;
        postServices.serviceCode = serviceArr;

        const response = await axios.post(
          `${baseUrl}patient/post`,
          postServices,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setSaving(false);
        props.patientObj.commenced = true;
        toast.success("Patient posted to services successfully.");
        props.toggle();
        // Don't redirect to home - let clinician decide next action
        // history.push("/");
      } catch (error) {
        setSaving(false);
        console.error(error);
        toast.error("Something went wrong during posting");
      }
    } else {
      toast.error("Kindly select a service to post the patient");
    }
  };

  // New function for checkout only (without posting to services)
  const handleCheckoutOnly = async () => {
    setCheckingOut(true);

    try {
      await axios.put(
        `${baseUrl}patient/visit/checkout/${patientObj.visitId}`,
        patientObj.visitId,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setCheckingOut(false);
      setShowCheckoutConfirm(false);
      props.patientObj.checkedOut = true;
      toast.success("Patient checked out successfully.");
      props.toggle();
      history.push("/");
    } catch (error) {
      setCheckingOut(false);
      console.error("Checkout error:", error);
      toast.error("Something went wrong during checkout. Please try again.");
    }
  };

  const toggleCheckoutConfirm = () => {
    setShowCheckoutConfirm(!showCheckoutConfirm);
  };

  return (
    <div>
      {/* Main Post Patient Modal */}
      <Modal
        show={props.showModal}
        toggle={props.toggle}
        className="fade"
        size="lg"
      >
        <Modal.Header toggle={props.toggle} style={{ backgroundColor: "#fff" }}>
          <Label
            for="post-services"
            style={{
              backgroundColor: "#fff",
              color: "#014d88",
              fontWeight: "bolder",
              fontSize: "18px",
            }}
          >
            <h5
              style={{
                fontWeight: "bold",
                fontSize: "30px",
                color: "#992E62",
              }}
            >
              Post Patient to Services
            </h5>
          </Label>
          <Button
            variant=""
            className="btn-close"
            onClick={props.toggle}
          ></Button>
        </Modal.Header>
        <Modal.Body>
          <Card>
            <CardBody>
              <form>
                <div className="row">
                  <DualListBox
                    options={services}
                    onChange={setSelectedOption}
                    selected={selectedOption}
                  />
                </div>
                {saving ? <Spinner /> : ""}
                <br />

                {/* Action Buttons */}
                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    justifyContent: "center",
                  }}
                >
                  {/* Post Patient Button - Only posts to services, no checkout */}
                  <MatButton
                    type="submit"
                    variant="contained"
                    color="primary"
                    className={classes.button}
                    startIcon={<SaveIcon />}
                    onClick={handleSubmit}
                    disabled={saving || checkingOut}
                    style={{ backgroundColor: "#014d88" }}
                  >
                    {!saving ? (
                      <span style={{ textTransform: "capitalize" }}>
                        Post to Services
                      </span>
                    ) : (
                      <span style={{ textTransform: "capitalize" }}>
                        Posting...
                      </span>
                    )}
                  </MatButton>

                  {/* Checkout Only Button */}
                  <MatButton
                    variant="contained"
                    className={classes.button}
                    startIcon={<ExitToAppIcon />}
                    onClick={toggleCheckoutConfirm}
                    disabled={saving || checkingOut}
                    style={{
                      backgroundColor: "#208001",
                      color: "#fff",
                    }}
                  >
                    <span style={{ textTransform: "capitalize" }}>
                      Checkout Only
                    </span>
                  </MatButton>
                </div>
              </form>
            </CardBody>
          </Card>
        </Modal.Body>
      </Modal>

      {/* Checkout Confirmation Modal */}
      <Modal
        show={showCheckoutConfirm}
        onHide={toggleCheckoutConfirm}
        className="fade"
        size="md"
      >
        <Modal.Header style={{ backgroundColor: "#fff" }}>
          <Modal.Title style={{ color: "#992E62", fontWeight: "bold" }}>
            Confirm Patient Checkout
          </Modal.Title>
          <button
            type="button"
            className="btn-close"
            onClick={toggleCheckoutConfirm}
            aria-label="Close"
          ></button>
        </Modal.Header>
        <Modal.Body>
          <div style={{ textAlign: "center", padding: "20px" }}>
            <p style={{ fontSize: "16px", marginBottom: "20px" }}>
              Are you sure you want to checkout{" "}
              <strong style={{ color: "#0B72AA" }}>
                {patientObj.fullname}
              </strong>{" "}
              (Hospital No: <strong>{patientObj.hospitalNumber}</strong>)
              without posting to any services?
            </p>
            <p style={{ fontSize: "14px", color: "#666" }}>
              This action will end the current visit for this patient without
              posting them to any additional services.
            </p>
          </div>
        </Modal.Body>
        <Modal.Footer style={{ justifyContent: "center" }}>
          <MatButton
            variant="outlined"
            onClick={toggleCheckoutConfirm}
            style={{
              marginRight: "10px",
              borderColor: "#6c757d",
              color: "#6c757d",
            }}
          >
            Cancel
          </MatButton>
          <MatButton
            variant="contained"
            onClick={handleCheckoutOnly}
            disabled={checkingOut}
            style={{
              backgroundColor: "#208001",
              color: "#fff",
            }}
          >
            {checkingOut ? (
              <>
                <Spinner size="sm" style={{ marginRight: "8px" }} />
                Checking Out...
              </>
            ) : (
              "Confirm Checkout"
            )}
          </MatButton>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default PostClient;
