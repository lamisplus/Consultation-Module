import { Grid, Label, Icon, Button } from "semantic-ui-react";
import moment from "moment";

export const DrugInfo = ({
  pharmacy,
  handleEditPharmacyOrder,
  handleDelete,
  handleAddPharmacyOrder,
  i,
}) => (
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

      {/* <Grid.Column width={3}>
        <Button
          color="primary"
          size="tiny"
          type="button"
          onClick={() => handleEditPharmacyOrder(pharmacy)}
        >
          <Icon name="eye" /> View
        </Button>
      </Grid.Column> */}

      <Grid.Column width={3}>
        <Button
          color="teal"
          size="tiny"
          type="button"
          onClick={() => handleEditPharmacyOrder(pharmacy)}
        >
          <Icon name="edit" /> Edit
        </Button>
      </Grid.Column>
    </Grid>
    <hr />
  </div>
);
