import * as React from "react";
import { styled } from "@mui/material/styles";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import Collapse from "@mui/material/Collapse";
import Avatar from "@mui/material/Avatar";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import FavoriteIcon from "@mui/icons-material/Favorite";
import ShareIcon from "@mui/icons-material/Share";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { Link } from "react-router-dom";
import { Button } from "@mui/material";

interface FinanceCardProps {
  title: string;
  date: string;
  image: string;
  description: string;
}

const ExpandMore = styled((props: { expand: boolean } & React.ComponentProps<typeof IconButton>) => {
  const { expand, ...other } = props;
  return <IconButton {...other} />;
})(({ expand }) => ({
  marginLeft: "auto",
  transition: "transform 0.2s ease-in-out",
  transform: expand ? "rotate(180deg)" : "rotate(0deg)",
}));

const FinanceCard: React.FC<FinanceCardProps> = ({ title, date, image, description }) => {
  const [expanded, setExpanded] = React.useState(false);

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  return (
    <Card
    sx={{
      maxWidth: 320,
      backgroundColor: "#1565c0",
      borderRadius: "30px",
      color: "white",
      display: "flex",
      flexDirection: "column",
      alignSelf: "flex-start", 
      padding: "20px",
      transition: "all 0.3s ease-in-out",
      "&:hover": {
        boxShadow: `
          2px 2px 5px #0c3266,  
          -2px -2px 5px #1a5bbf  
        `,
        transform: "scale(1.05)", // Slight hover effect
      },
    }}
  >
      <CardHeader
      
        action={
          <IconButton aria-label="settings">
            <MoreVertIcon sx={{ color: "white" }} />
          </IconButton>
        }
        title={<Typography sx={{ color: "white" }}>{title}</Typography>}
        subheader={<Typography sx={{ color: "white" }}>{date}</Typography>}
      />
      <div style={{ width: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <img src={image} style={{ width: "85%", display: "block" }} alt={title} />
      </div>
      <CardContent>
        <Typography variant="body2"><></></Typography>
      </CardContent>
      <CardActions disableSpacing>
        <Button  style={{ margin: '2%', backgroundColor: '#051323'}} variant="contained"><Link to="/signin">Partner</Link></Button>
        <IconButton aria-label="share">
          <ShareIcon sx={{ color: "white" }} />
        </IconButton>
        <ExpandMore expand={expanded} onClick={handleExpandClick} aria-expanded={expanded} aria-label="show more">
          <ExpandMoreIcon sx={{ color: "white" }} />
        </ExpandMore>
      </CardActions>
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <CardContent>
          <Typography sx={{ color: "white" }}>{description}</Typography>
        </CardContent>
      </Collapse>
    </Card>
  );
};

export default FinanceCard;
