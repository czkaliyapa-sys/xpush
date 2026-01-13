import * as React from "react";
import { styled } from "@mui/material/styles";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import FavoriteIcon from "@mui/icons-material/Favorite";
import ShareIcon from "@mui/icons-material/Share";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import CloseIcon from "@mui/icons-material/Close";
import { Link } from "react-router-dom";
import { Button, Modal, Box } from "@mui/material";

interface FashionCardProps {
  title: string;
  date: string;
  images: string[];
  description: string;
  price: string;
}

const ExpandMore = styled((props: { expand: boolean } & React.ComponentProps<typeof IconButton>) => {
  const { expand, ...other } = props;
  return <IconButton {...other} />;
})(({ expand }) => ({
  marginLeft: "auto",
  transition: "transform 0.2s ease-in-out",
  transform: expand ? "rotate(180deg)" : "rotate(0deg)",
}));

const FashionCard: React.FC<FashionCardProps> = ({ title, date, images, description, price }) => {
  const [expanded, setExpanded] = React.useState(false);
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);
  const [modalOpen, setModalOpen] = React.useState(false);

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  };

  return (
    <>
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
          position: "relative",
          "&:hover": {
            boxShadow: `2px 2px 5px #0c3266, -2px -2px 5px #1a5bbf`,
            transform: "scale(1.05)",
          },
        }}
      >
        <CardHeader
          action={
            <IconButton aria-label="view" onClick={() => setModalOpen(true)}>
            <VisibilityIcon sx={{ color: "white" }} />
          </IconButton>
          }
          title={<Typography sx={{ color: "white" }}>{title}</Typography>}
          subheader={<Typography sx={{ color: "white" }}>{date}</Typography>}
        />
        <div style={{ width: "100%", display: "flex", justifyContent: "center", alignItems: "center", position: "relative" }}>
          <img
            src={images[currentImageIndex]}
            style={{ width: "85%", display: "block" }}
            alt={title}
          />
        </div>
        <CardContent>
          <Typography variant="body2"></Typography>
        </CardContent>
        <CardActions disableSpacing>
          <Button style={{ margin: '2%', backgroundColor: '#051323' }} variant="contained">
            <Link to="/signin">{price}</Link>
          </Button>
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
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            bgcolor: "#051323",
            boxShadow: 24,
            p: 4,
            borderRadius: "10px",
            width: { xs: "90%", sm: "80%", md: "60%", lg: "45%" },
            textAlign: "center",
          }}
        >
          <IconButton onClick={() => setModalOpen(false)} sx={{ color: 'white', position: "absolute", right: 10, top: 10 }}>
            <CloseIcon />
          </IconButton>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
            <IconButton onClick={handlePrevImage} sx={{ color: 'white', position: "absolute", left: 10 }}>
              <ArrowBackIosIcon />
            </IconButton>
            <img src={images[currentImageIndex]} style={{ maxWidth: "100%", maxHeight: "20%" }} alt={title} />
            <IconButton onClick={handleNextImage} sx={{ color: 'white', position: "absolute", right: 10 }}>
              <ArrowForwardIosIcon />
            </IconButton>
          </div>
        </Box>
      </Modal>
    </>
  );
};

export default FashionCard;
