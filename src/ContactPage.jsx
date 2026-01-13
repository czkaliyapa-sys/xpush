import React, { useState, useEffect } from "react";
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import { Button, FormControl, InputLabel, Select, MenuItem, Alert, CircularProgress } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import SEOMeta from './components/SEOMeta.jsx';
import { getCanonicalUrl } from './utils/seoUtils.js';
 
import useMediaQuery from "@mui/material/useMediaQuery";
import styles from "./style";
 
import { contactAPI } from './services/api.js';


const ContactPage = () => {
    const location = useLocation();
    const isSmallScreen = useMediaQuery("(max-width:800px)");
    const formWidth = isSmallScreen ? "100%" : "60%";

    
    const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
    const [subjects, setSubjects] = useState([
      'General Inquiry',
      'Product Question',
      'Order Issue',
      'Installment Plan',
      'Partnership',
      'Technical Support',
      'Refund Request',
      'Shipping',
      'Other'
    ]);
    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    // Structured data for ContactPage
    const contactStructuredData = {
      "@context": "https://schema.org",
      "@type": "ContactPage",
      "@id": "https://itsxtrapush.com/contact#webpage",
      "url": "https://itsxtrapush.com/contact",
      "name": "Contact Xtrapush Gadgets",
      "description": "Get in touch with Xtrapush Gadgets customer support team. We're here to help with orders, products, and inquiries.",
      "mainEntity": {
        "@type": "Organization",
        "@id": "https://itsxtrapush.com/#organization",
        "name": "Xtrapush Gadgets",
        "contactPoint": [
          {
            "@type": "ContactPoint",
            "contactType": "Customer Service",
            "telephone": "+44-7506-369609",
            "email": "conrad@itsxtrapush.com",
            "areaServed": "GB",
            "availableLanguage": "English",
            "hoursAvailable": {
              "@type": "OpeningHoursSpecification",
              "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
              "opens": "09:00",
              "closes": "18:00"
            }
          },
          {
            "@type": "ContactPoint",
            "contactType": "Customer Service",
            "telephone": "+265-994-385706",
            "email": "kelvin@itsxtrapush.com",
            "areaServed": "MW",
            "availableLanguage": "English"
          }
        ]
      }
    };

    const breadcrumbStructuredData = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://itsxtrapush.com/"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Contact",
          "item": "https://itsxtrapush.com/contact"
        }
      ]
    };


    useEffect(() => {
        setTimeout(() => { window.dispatchEvent(new Event("resize")); }, 0);
        // Fetch subjects from backend (optional)
        (async () => {
          try {
            const res = await contactAPI.getSubjects();
            if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
              setSubjects(res.data);
            }
          } catch (e) {
            // Keep local defaults on failure
          }
        })();
      }, []);

    const handleChange = (field) => (e) => {
      setForm(prev => ({ ...prev, [field]: e.target.value }));
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      setErrorMsg('');
      setSuccessMsg('');
      // Basic validation
      if (!form.name || !form.email || !form.subject || !form.message) {
        setErrorMsg('Please fill in all fields.');
        return;
      }
      const emailValid = /.+@.+\..+/.test(form.email);
      if (!emailValid) {
        setErrorMsg('Please enter a valid email address.');
        return;
      }
      try {
        setLoading(true);
        const res = await contactAPI.send(form);
        if (res?.success) {
          setSuccessMsg('Message sent successfully. We will get back to you soon.');
          setForm({ name: '', email: '', subject: '', message: '' });
        } else {
          setErrorMsg(res?.error || 'Failed to send message.');
        }
      } catch (e) {
        setErrorMsg(e?.response?.data?.error || 'Failed to send message. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

  return (
    <>
      <SEOMeta
        title="Contact Us - Xtrapush Gadgets Customer Support | UK & Malawi"
        description="Contact Xtrapush Gadgets customer support team. Get help with orders, products, shipping, returns, and technical support. Available in UK and Malawi. Email, phone, or contact form."
        keywords="contact xtrapush, customer support, customer service, help, contact us, email, phone, support team, order help, shipping inquiries"
        canonical={getCanonicalUrl(location.pathname)}
        ogTitle="Contact Xtrapush Gadgets - Customer Support"
        ogDescription="Get in touch with our customer support team for assistance with orders, products, and inquiries."
        ogUrl={getCanonicalUrl(location.pathname)}
        structuredData={[contactStructuredData, breadcrumbStructuredData]}
      />
    <div className="deep bg-primary w-full overflow-hidden">
    
    <div className={`${styles.paddingX} ${styles.flexCenter}`}>
      <div className={`${styles.boxWidth}`}>
              
        <section className="flex flex-col items-center text-center p-12">
      <h1 className="text-white text-6xl mb-8">Got a Challenge?</h1>
      <h2 className="text-white text-5xl mb-6">We are here to help</h2>
      <>
        <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{
              width: formWidth, // Responsive width
              margin: "auto",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: { xs: 2.5, sm: 2 },
              padding: { xs: 2, sm: 3 },
              backgroundColor: "#051323",
              borderRadius: 2,
            }}
            noValidate
            autoComplete="off"
        >
         {successMsg && <Alert severity="success" sx={{ width: '100%' }}>{successMsg}</Alert>}
         {errorMsg && <Alert severity="error" sx={{ width: '100%' }}>{errorMsg}</Alert>}
         <TextField
  id="name"
  label="Name"
  placeholder="John Doe"
  fullWidth
  value={form.name}
  onChange={handleChange('name')}
  sx={{
    "& .MuiInputBase-input": { color: "white" },
    "& .MuiInputLabel-root": { color: "white" },
    "& .MuiInputLabel-root.Mui-focused": { color: "white" },
    "& .MuiOutlinedInput-root": {
      "& fieldset": { borderColor: "white" },
      "&:hover fieldset": { borderColor: "lightgray" },
    },
    // Increase input height and font on mobile
    "& .MuiOutlinedInput-input": {
      padding: { xs: "18px 16px", sm: "14px 12px" },
      fontSize: { xs: "17px", sm: "15px" },
      lineHeight: 1.5,
    },
    "& .MuiInputBase-input::placeholder": {
      color: "white",
      opacity: 1,
    },
  }}
/>
<FormControl fullWidth>
  <InputLabel id="subject-label" sx={{ color: 'white' }}>Subject</InputLabel>
  <Select
    labelId="subject-label"
    id="subject"
    value={form.subject}
    label="Subject"
    onChange={handleChange('subject')}
    sx={{
      color: 'white',
      "& .MuiOutlinedInput-notchedOutline": { borderColor: 'white' },
      "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: 'lightgray' },
      "& .MuiSvgIcon-root": { color: 'white' },
      // Increase select height and font on mobile
      "& .MuiSelect-select": {
        padding: { xs: "18px 16px", sm: "14px 12px" },
        fontSize: { xs: "17px", sm: "15px" },
        lineHeight: 1.5,
      }
    }}
  >
    {subjects.map((s) => (
      <MenuItem key={s} value={s}>{s}</MenuItem>
    ))}
  </Select>
</FormControl>

<TextField
  id="email"
  label="Email"
  placeholder="johndoe@gmail.com"
  fullWidth
  value={form.email}
  onChange={handleChange('email')}
  sx={{
    "& .MuiInputBase-input": { color: "white" },
    "& .MuiInputLabel-root": { color: "white" },
    "& .MuiInputLabel-root.Mui-focused": { color: "white" },
    "& .MuiOutlinedInput-root": {
      "& fieldset": { borderColor: "white" },
      "&:hover fieldset": { borderColor: "lightgray" },
    },
    // Increase input height and font on mobile
    "& .MuiOutlinedInput-input": {
      padding: { xs: "18px 16px", sm: "14px 12px" },
      fontSize: { xs: "17px", sm: "15px" },
      lineHeight: 1.5,
    },
    "& .MuiInputBase-input::placeholder": {
      color: "white",
      opacity: 1,
    },
  }}
/>

<TextField
  id="message"
  label="Message"
  placeholder="I have this issue..."
  multiline
  rows={6}
  fullWidth
  value={form.message}
  onChange={handleChange('message')}
  sx={{
    "& .MuiInputBase-input": { color: "white" },
    "& .MuiInputLabel-root": { color: "white" },
    "& .MuiInputLabel-root.Mui-focused": { color: "white" },
    "& .MuiOutlinedInput-root": {
      "& fieldset": { borderColor: "white" },
      "&:hover fieldset": { borderColor: "lightgray" },
    },
    // Larger font for multiline content on mobile
    "& .MuiOutlinedInput-inputMultiline": {
      fontSize: { xs: "17px", sm: "15px" },
      minHeight: { xs: 140, sm: 120 },
      lineHeight: 1.6,
    },
    "& .MuiInputBase-input::placeholder": {
      color: "white",
      opacity: 1,
    },
  }}
/>

          <Button
            variant="contained"
            sx={{
              width: "100%",
              py: { xs: 1.5, sm: 1.25 },
              fontSize: { xs: "16px", sm: "15px" },
              backgroundColor: "#48CEDB",
              color: "#white",
              "&:hover": { backgroundColor: "darkblue" },
            }}
            type="submit"
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'Submit'}
          </Button>
        </Box>
      </>
    </section>
       
      </div>
    </div>
  </div>
    </>
   
  );
}

export default ContactPage;
