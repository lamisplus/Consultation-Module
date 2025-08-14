import { Grid, Label, Icon, Button } from "semantic-ui-react";
import moment from "moment";

export const DrugInfo = ({
  pharmacy,
  handleEditPharmacyOrder,
  handleDelete,
  handleAddPharmacyOrder,
  i,
}) => {
  console.log("order to edit: ", pharmacy);
  return (
    <div className="page-header" key={i}>
      <Grid columns={4} verticalAlign="middle">
        <Grid.Column width={5}>
          <b>Medication:</b>
          <br /> {pharmacy?.medicationName}
        </Grid.Column>

        <Grid.Column width={5}>
          <b>Date Ordered:</b>
          <br />
          {moment(pharmacy?.prescriptionDate).format("YYYY-MM-DD h:mm A")}
        </Grid.Column>

        

        <Grid.Column width={6} style={{display: "flex", flexDirection: "row"}}>
          <Button
            color="teal"
            size="tiny"
            type="button"
            onClick={() => handleEditPharmacyOrder(pharmacy)}
          >
            <Icon name="edit" /> Edit
          </Button>

          <Button
            color="red"
            size="tiny"
            type="button"
            onClick={() => handleDelete(pharmacy.id)}
          >
            <Icon name="remove" /> Remove
          </Button>
        </Grid.Column>

        {/* <Grid.Column width={3}>
          <Button
            color="red"
            size="tiny"
            type="button"
            onClick={() => handleEditPharmacyOrder(pharmacy)}
          >
            <Icon name="remove" /> Remove
          </Button>
        </Grid.Column> */}
      </Grid>
      <hr />
    </div>
  );
};
