import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Container,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Link,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InfoIcon from '@mui/icons-material/Info';
import SecurityIcon from '@mui/icons-material/Security';
import GavelIcon from '@mui/icons-material/Gavel';
import EmailIcon from '@mui/icons-material/Email';
import { useLocation } from '../contexts/LocationContext';

const PolicyCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  borderRadius: theme.spacing(2),
  backgroundColor: 'rgba(255, 255, 255, 0.08)',
  color: '#ffffff',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  backdropFilter: 'blur(10px)',
  '&:hover': {
    borderColor: '#48CEDB',
    boxShadow: theme.shadows[4]
  }
}));

const SectionHeader = styled(Typography)(({ theme }) => ({
  fontWeight: 'bold',
  color: 'white',
  marginTop: theme.spacing(3),
  marginBottom: theme.spacing(1),
  paddingBottom: theme.spacing(1),
  borderBottom: '2px solid rgba(72, 206, 219, 0.3)',
}));

const TermsPolicy = () => {
  const { isMalawi } = useLocation();
  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      {/* Header */}
      <Box textAlign="center" mb={4}>
        <Typography 
          variant="h3" 
          component="h1" 
          gutterBottom
          sx={{ 
            fontWeight: 'bold',
            color: 'white',
            mb: 2
          }}
        >
          📋 Xtrapush Gadgets – Terms & Conditions
        </Typography>
        <Typography 
          variant="body1" 
          sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 1 }}
        >
          Last updated: December 2025
        </Typography>
        <Paper sx={{ p: 2, bgcolor: 'rgba(72, 206, 219, 0.1)', border: '1px solid rgba(72, 206, 219, 0.3)', borderRadius: 2 }}>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.85)' }}>
            These Terms & Conditions govern the purchase of gadgets through <strong>Xtrapush</strong> either via instalment payments or direct checkout. 
            By placing an order or using our services, you agree to these Terms. Please read them carefully. If you do not agree, do not proceed with an order.
          </Typography>
        </Paper>
      </Box>

      {/* Section 1 */}
      <PolicyCard>
        <CardContent>
          <SectionHeader variant="h5">1. About Xtrapush Gadgets</SectionHeader>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.85)', mb: 2 }}>
            Xtrapush provides flexible ways for customers to <strong>buy gadgets</strong> through instalment payments or direct purchase.
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.85)', mb: 2, fontWeight: 600 }}>
            Customers can choose one of the following options:
          </Typography>
          <List>
            <ListItem>
              <ListItemIcon><CheckCircleIcon sx={{ color: '#48CEDB' }} /></ListItemIcon>
              <ListItemText 
                primary="Direct Checkout Purchase"
                secondary="Pay the full price upfront and receive the gadget immediately."
                secondaryTypographyProps={{ sx: { color: 'rgba(255, 255, 255, 0.7)' } }}
                primaryTypographyProps={{ sx: { color: 'white', fontWeight: 600 } }}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><CheckCircleIcon sx={{ color: '#48CEDB' }} /></ListItemIcon>
              <ListItemText 
                primary="Pay to Own"
                secondary="Pay installments first, then receive or collect the gadget after full payment. Ownership transfers to you."
                secondaryTypographyProps={{ sx: { color: 'rgba(255, 255, 255, 0.7)' } }}
                primaryTypographyProps={{ sx: { color: 'white', fontWeight: 600 } }}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><CheckCircleIcon sx={{ color: '#48CEDB' }} /></ListItemIcon>
              <ListItemText 
                primary="Pay to Lease"
                secondary="Pay to borrow and use the device temporarily. Device remains under Xtrapush ownership. Return or convert to ownership at end of lease."
                secondaryTypographyProps={{ sx: { color: 'rgba(255, 255, 255, 0.7)' } }}
                primaryTypographyProps={{ sx: { color: 'white', fontWeight: 600 } }}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><CheckCircleIcon sx={{ color: 'rgba(255, 255, 255, 0.3)' }} /></ListItemIcon>
              <ListItemText 
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography component="span" sx={{ color: 'rgba(255, 255, 255, 0.4)', fontWeight: 600 }}>Pay as You Go</Typography>
                    <Typography component="span" sx={{ fontSize: '0.7rem', bgcolor: 'rgba(255, 255, 255, 0.1)', color: 'rgba(255, 255, 255, 0.6)', px: 1, py: 0.25, borderRadius: 1, fontWeight: 500 }}>
                      COMING SOON
                    </Typography>
                  </Box>
                }
                secondary="Receive and use the gadget as yours while paying installments."
                secondaryTypographyProps={{ sx: { color: 'rgba(255, 255, 255, 0.4)' } }}
              />
            </ListItem>
          </List>
          <Box sx={{ pl: 2, pr: 2, p: 1.5, bgcolor: 'rgba(255, 255, 255, 0.05)', borderLeft: '3px solid rgba(255, 255, 255, 0.3)', borderRadius: 1, mb: 2 }}>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: 500 }}>
              Pay as You Go is currently not available. This payment option is coming soon.
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', mt: 2, fontWeight: 500 }}>
            * NOTE: All installment options are explained in detail on our <Link href="/installment-policy" sx={{ color: '#48CEDB', textDecoration: 'none', fontWeight: 600, '&:hover': { textDecoration: 'underline' } }}>Installment Policy Page</Link>, which is part of these Terms.
          </Typography>
        </CardContent>
      </PolicyCard>

      {/* Section 2 */}
      <PolicyCard>
        <CardContent>
          <SectionHeader variant="h5">2. Eligibility</SectionHeader>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.85)', mb: 2 }}>
            To use Xtrapush Gadgets services, you must:
          </Typography>
          <List>
            <ListItem>
              <ListItemIcon><CheckCircleIcon sx={{ color: '#48CEDB' }} /></ListItemIcon>
              <ListItemText primary="Provide accurate personal and contact information" primaryTypographyProps={{ sx: { color: 'rgba(255, 255, 255, 0.85)' } }} />
            </ListItem>
            <ListItem>
              <ListItemIcon><CheckCircleIcon sx={{ color: '#48CEDB' }} /></ListItemIcon>
              <ListItemText primary="Have a valid payment method accepted by Xtrapush Gadgets" primaryTypographyProps={{ sx: { color: 'rgba(255, 255, 255, 0.85)' } }} />
            </ListItem>
          </List>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', mt: 2, fontWeight: 500 }}>
            We reserve the right to decline any application at our discretion.
          </Typography>
        </CardContent>
      </PolicyCard>

      {/* Section 3 */}
      <PolicyCard>
        <CardContent>
          <SectionHeader variant="h5">3. Gadget Listings & Condition</SectionHeader>
          <List>
            <ListItem>
              <ListItemIcon><InfoIcon sx={{ color: '#48CEDB' }} /></ListItemIcon>
              <ListItemText 
                primary="Gadgets may be new, refurbished, or pre-owned."
                primaryTypographyProps={{ sx: { color: 'rgba(255, 255, 255, 0.85)' } }}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><InfoIcon sx={{ color: '#48CEDB' }} /></ListItemIcon>
              <ListItemText 
                primary="Each product page clearly states the condition (e.g., Fair, Good, Excellent)."
                primaryTypographyProps={{ sx: { color: 'rgba(255, 255, 255, 0.85)' } }}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><InfoIcon sx={{ color: '#48CEDB' }} /></ListItemIcon>
              <ListItemText 
                primary="Images are for illustration purposes; minor cosmetic differences may exist."
                primaryTypographyProps={{ sx: { color: 'rgba(255, 255, 255, 0.85)' } }}
              />
            </ListItem>
          </List>
        </CardContent>
      </PolicyCard>

      {/* Section 4 */}
      <PolicyCard>
        <CardContent>
          <SectionHeader variant="h5">4. Pricing & Payments</SectionHeader>
          <List>
            <ListItem>
              <ListItemIcon><CheckCircleIcon sx={{ color: '#48CEDB' }} /></ListItemIcon>
              <ListItemText 
                primary="Prices are shown in the applicable currency and may include or exclude delivery costs (clearly stated at checkout)."
                primaryTypographyProps={{ sx: { color: 'rgba(255, 255, 255, 0.85)' } }}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><CheckCircleIcon sx={{ color: '#48CEDB' }} /></ListItemIcon>
              <ListItemText 
                primary="Installment amounts, frequency, and duration are displayed on the Installment Page and checkout."
                primaryTypographyProps={{ sx: { color: 'rgba(255, 255, 255, 0.85)' } }}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><CheckCircleIcon sx={{ color: '#48CEDB' }} /></ListItemIcon>
              <ListItemText 
                primary="Failure to make payments on time may result in penalties as outlined below."
                primaryTypographyProps={{ sx: { color: 'rgba(255, 255, 255, 0.85)' } }}
              />
            </ListItem>
          </List>
        </CardContent>
      </PolicyCard>

      {/* Section 5 - Accordion */}
      <PolicyCard>
        <CardContent>
          <SectionHeader variant="h5">5. Installment Options (Linked Policy)</SectionHeader>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.85)', mb: 2 }}>
            Your installment agreement is governed by the specific plan you choose. For complete details, visit our <Link href="/installment-policy" sx={{ color: '#48CEDB', fontWeight: 600, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>Installment Policy Page</Link>.
          </Typography>

          <Accordion sx={{ bgcolor: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(5px)', mb: 2, '&:before': { display: 'none' }, opacity: 0.6 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'rgba(255, 255, 255, 0.4)' }} />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.5)', fontWeight: 600 }}>5.1 Pay as You Go</Typography>
                <Typography component="span" sx={{ fontSize: '0.7rem', bgcolor: 'rgba(255, 255, 255, 0.1)', color: 'rgba(255, 255, 255, 0.6)', px: 1, py: 0.25, borderRadius: 1, fontWeight: 500 }}>
                  COMING SOON
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <List sx={{ width: '100%' }}>
                <ListItem>
                  <ListItemIcon><CheckCircleIcon sx={{ color: '#48CEDB' }} /></ListItemIcon>
                  <ListItemText 
                    primary="Receive and use the gadget as yours while paying installments."
                    primaryTypographyProps={{ sx: { color: 'rgba(255, 255, 255, 0.85)' } }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckCircleIcon sx={{ color: '#48CEDB' }} /></ListItemIcon>
                  {/* Removed: Full ownership transfers to you after all payments are complete. */}
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckCircleIcon sx={{ color: '#48CEDB' }} /></ListItemIcon>
                  <ListItemText 
                    primary="Payments must be made on time as shown on the Installment Policy Page."
                    primaryTypographyProps={{ sx: { color: 'rgba(255, 255, 255, 0.85)' } }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><InfoIcon sx={{ color: '#48CEDB' }} /></ListItemIcon>
                  <ListItemText 
                    primary="Late or missed payments may result in restricted functionality, temporary suspension, or device recovery."
                    primaryTypographyProps={{ sx: { color: 'rgba(255, 255, 255, 0.85)' } }}
                  />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>

          <Accordion defaultExpanded sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(5px)', mb: 2, '&:before': { display: 'none' } }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#48CEDB' }} />}>
              <Typography variant="h6" sx={{ color: '#48CEDB', fontWeight: 600 }}>5.2 Pay to Own</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List sx={{ width: '100%' }}>
                <ListItem>
                  <ListItemIcon><CheckCircleIcon sx={{ color: '#48CEDB' }} /></ListItemIcon>
                  <ListItemText 
                    primary="Instalments must be fully completed before device collection or delivery."
                    primaryTypographyProps={{ sx: { color: 'rgba(255, 255, 255, 0.85)' } }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckCircleIcon sx={{ color: '#48CEDB' }} /></ListItemIcon>
                  <ListItemText 
                    primary="Ownership transfers only after full payment."
                    primaryTypographyProps={{ sx: { color: 'rgba(255, 255, 255, 0.85)' } }}
                  />
                </ListItem>
              </List>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.75)', mt: 2, fontStyle: 'italic' }}>
                Full details, examples, and consequences are explained on the <Link href="/installment-policy" sx={{ color: '#48CEDB', fontWeight: 600, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>Installment Policy Page</Link>, which should be read together with these Terms.
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(5px)', '&:before': { display: 'none' } }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#48CEDB' }} />}>
              <Typography variant="h6" sx={{ color: '#48CEDB', fontWeight: 600 }}>5.3 Pay to Lease</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List sx={{ width: '100%' }}>
                <ListItem>
                  <ListItemIcon><CheckCircleIcon sx={{ color: '#48CEDB' }} /></ListItemIcon>
                  <ListItemText 
                    primary="Pay to borrow and use the device temporarily during the lease period."
                    primaryTypographyProps={{ sx: { color: 'rgba(255, 255, 255, 0.85)' } }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckCircleIcon sx={{ color: '#48CEDB' }} /></ListItemIcon>
                  <ListItemText 
                    primary="Device remains the property of Xtrapush throughout the lease."
                    primaryTypographyProps={{ sx: { color: 'rgba(255, 255, 255, 0.85)' } }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckCircleIcon sx={{ color: '#48CEDB' }} /></ListItemIcon>
                  <ListItemText 
                    primary="At the end of the lease, return the device or convert to Pay to Own."
                    primaryTypographyProps={{ sx: { color: 'rgba(255, 255, 255, 0.85)' } }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><InfoIcon sx={{ color: '#48CEDB' }} /></ListItemIcon>
                  <ListItemText 
                    primary="Device must be returned in good working condition. Damage fees may apply."
                    primaryTypographyProps={{ sx: { color: 'rgba(255, 255, 255, 0.85)' } }}
                  />
                </ListItem>
              </List>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.75)', mt: 2, fontStyle: 'italic' }}>
                Full details on the <Link href="/installment-policy" sx={{ color: '#48CEDB', fontWeight: 600, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>Installment Policy Page</Link>.
              </Typography>
            </AccordionDetails>
          </Accordion>
        </CardContent>
      </PolicyCard>

      {/* Section 6 */}
      <PolicyCard>
        <CardContent>
          <SectionHeader variant="h5">6. Ownership & Risk</SectionHeader>
          <List>
            <ListItem>
              <ListItemIcon><SecurityIcon sx={{ color: '#48CEDB' }} /></ListItemIcon>
              <ListItemText 
                primary="Ownership transfers to the customer only after full payment."
                primaryTypographyProps={{ sx: { color: 'rgba(255, 255, 255, 0.85)' } }}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><SecurityIcon sx={{ color: '#48CEDB' }} /></ListItemIcon>
              <ListItemText 
                primary="Once the gadget is delivered or collected, the customer is responsible for loss, theft, or damage, unless otherwise stated."
                primaryTypographyProps={{ sx: { color: 'rgba(255, 255, 255, 0.85)' } }}
              />
            </ListItem>
          </List>
        </CardContent>
      </PolicyCard>

      {/* Section 7 */}
      <PolicyCard>
        <CardContent>
          <SectionHeader variant="h5">7. Late Payments & Default</SectionHeader>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.85)', mb: 2 }}>
            If a payment is missed:
          </Typography>
          <List>
            <ListItem>
              <ListItemIcon><InfoIcon sx={{ color: '#48CEDB' }} /></ListItemIcon>
              <ListItemText 
                primary="Reminder notifications may be sent"
                primaryTypographyProps={{ sx: { color: 'rgba(255, 255, 255, 0.85)' } }}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><InfoIcon sx={{ color: '#48CEDB' }} /></ListItemIcon>
              <ListItemText 
                primary="Late fees may apply"
                primaryTypographyProps={{ sx: { color: 'rgba(255, 255, 255, 0.85)' } }}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon></ListItemIcon>
              <ListItemText 
                primary="Device features may be limited on leased gadgets (Pay to Lease plans). Smartphones, tablets, and laptops will always be monitored; other gadgets may also be eligible for monitoring and restrictions."
                primaryTypographyProps={{ sx: { color: '#48CEDB', fontWeight: 500 } }}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><InfoIcon sx={{ color: '#48CEDB' }} /></ListItemIcon>
              <ListItemText 
                primary="Continued default may lead to account suspension, device recovery, or termination of the agreement."
                primaryTypographyProps={{ sx: { color: 'rgba(255, 255, 255, 0.85)' } }}
              />
            </ListItem>
          </List>
        </CardContent>
      </PolicyCard>

      {/* Section 8 */}
      <PolicyCard>
        <CardContent>
          <SectionHeader variant="h5">8. Returns & Cancellations</SectionHeader>
          <List>
            <ListItem>
              <ListItemIcon><CheckCircleIcon sx={{ color: '#48CEDB' }} /></ListItemIcon>
              <ListItemText 
                primary="Returns are subject to our Returns Policy (displayed on the site)."
                primaryTypographyProps={{ sx: { color: 'rgba(255, 255, 255, 0.85)' } }}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><CheckCircleIcon sx={{ color: '#48CEDB' }} /></ListItemIcon>
              <ListItemText 
                primary="Installment plans may not be cancellable once activated, unless required by law."
                primaryTypographyProps={{ sx: { color: 'rgba(255, 255, 255, 0.85)' } }}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><CheckCircleIcon sx={{ color: '#48CEDB' }} /></ListItemIcon>
              <ListItemText 
                primary="Any approved refunds will account for usage, damage, or outstanding balances."
                primaryTypographyProps={{ sx: { color: 'rgba(255, 255, 255, 0.85)' } }}
              />
            </ListItem>
          </List>
        </CardContent>
      </PolicyCard>

      {/* Section 9 */}
      <PolicyCard>
        <CardContent>
          <SectionHeader variant="h5">9. Warranties & Repairs</SectionHeader>
          <List>
            <ListItem>
              <ListItemIcon><CheckCircleIcon sx={{ color: '#48CEDB' }} /></ListItemIcon>
              <ListItemText 
                primary="Gadgets may include a limited warranty, stated on the product page."
                primaryTypographyProps={{ sx: { color: 'rgba(255, 255, 255, 0.85)' } }}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><CheckCircleIcon sx={{ color: '#48CEDB' }} /></ListItemIcon>
              <ListItemText 
                primary="Damage caused by misuse, unauthorised repairs, or negligence is not covered."
                primaryTypographyProps={{ sx: { color: 'rgba(255, 255, 255, 0.85)' } }}
              />
            </ListItem>
          </List>
        </CardContent>
      </PolicyCard>

      {/* Section 10 - Subscription Plans */}
      <PolicyCard>
        <CardContent>
          <SectionHeader variant="h5">10. Xtrapush Subscription Plans</SectionHeader>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.85)', mb: 3 }}>
            Xtrapush offers two subscription tiers to enhance your shopping experience with delivery benefits and gadget insurance. 
            <strong> Gadget insurance covers laptops, smartphones, and tablets only.</strong>
          </Typography>

          {/* Xtrapush Plus */}
          <Accordion defaultExpanded sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(5px)', mb: 2, '&:before': { display: 'none' } }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#48CEDB' }} />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Typography variant="h6" sx={{ color: '#48CEDB', fontWeight: 600 }}>Xtrapush Plus</Typography>
                <Typography component="span" sx={{ fontSize: '0.8rem', bgcolor: 'rgba(72, 206, 219, 0.2)', color: '#48CEDB', px: 1.5, py: 0.25, borderRadius: 1, fontWeight: 600 }}>
                  {isMalawi ? 'MWK 6,000/mo' : '£6.00/mo'}
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.85)', mb: 2, fontWeight: 500 }}>
                Our entry-level subscription for customers who want free delivery and single-gadget protection.
              </Typography>
              <List sx={{ width: '100%' }}>
                <ListItem>
                  <ListItemIcon><CheckCircleIcon sx={{ color: '#48CEDB' }} /></ListItemIcon>
                  <ListItemText 
                    primary="Free Unlimited Delivery"
                    secondary="All orders delivered free of charge during your subscription period"
                    secondaryTypographyProps={{ sx: { color: 'rgba(255, 255, 255, 0.7)' } }}
                    primaryTypographyProps={{ sx: { color: 'white', fontWeight: 600 } }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><SecurityIcon sx={{ color: '#48CEDB' }} /></ListItemIcon>
                  <ListItemText 
                    primary="Single Gadget Insurance (1 Year)"
                    secondary="Covers ONE laptop, smartphone, or tablet for free repairs and replacements from purchase date. Insurance applies to your most recent eligible purchase."
                    secondaryTypographyProps={{ sx: { color: 'rgba(255, 255, 255, 0.7)' } }}
                    primaryTypographyProps={{ sx: { color: 'white', fontWeight: 600 } }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckCircleIcon sx={{ color: '#48CEDB' }} /></ListItemIcon>
                  <ListItemText 
                    primary="Minor Discounts"
                    secondary="Small savings on selected items"
                    secondaryTypographyProps={{ sx: { color: 'rgba(255, 255, 255, 0.7)' } }}
                    primaryTypographyProps={{ sx: { color: 'white', fontWeight: 600 } }}
                  />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>

          {/* Xtrapush Premium */}
          <Accordion defaultExpanded sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(5px)', mb: 2, '&:before': { display: 'none' }, border: '1px solid rgba(72, 206, 219, 0.3)' }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#48CEDB' }} />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Typography variant="h6" sx={{ color: '#48CEDB', fontWeight: 600 }}>Xtrapush Premium</Typography>
                <Typography component="span" sx={{ fontSize: '0.8rem', bgcolor: 'rgba(72, 206, 219, 0.2)', color: '#48CEDB', px: 1.5, py: 0.25, borderRadius: 1, fontWeight: 600 }}>
                  {isMalawi ? 'MWK 10,000/mo' : '£9.99/mo'}
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.85)', mb: 2, fontWeight: 500 }}>
                Our comprehensive subscription for customers who want maximum protection across all their gadgets.
              </Typography>
              <List sx={{ width: '100%' }}>
                <ListItem>
                  <ListItemIcon><CheckCircleIcon sx={{ color: '#48CEDB' }} /></ListItemIcon>
                  <ListItemText 
                    primary="Free Unlimited Delivery"
                    secondary="All orders delivered free of charge during your subscription period"
                    secondaryTypographyProps={{ sx: { color: 'rgba(255, 255, 255, 0.7)' } }}
                    primaryTypographyProps={{ sx: { color: 'white', fontWeight: 600 } }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><SecurityIcon sx={{ color: '#48CEDB' }} /></ListItemIcon>
                  <ListItemText 
                    primary="Multiple Gadget Insurance (1 Year Each)"
                    secondary="Covers ALL eligible laptops, smartphones, and tablets purchased during your subscription period. Each gadget is insured for 1 year from its purchase date."
                    secondaryTypographyProps={{ sx: { color: 'rgba(255, 255, 255, 0.7)' } }}
                    primaryTypographyProps={{ sx: { color: 'white', fontWeight: 600 } }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckCircleIcon sx={{ color: '#48CEDB' }} /></ListItemIcon>
                  <ListItemText 
                    primary="Exclusive Member Discounts"
                    secondary="Access to members-only deals and special pricing on all gadgets"
                    secondaryTypographyProps={{ sx: { color: 'rgba(255, 255, 255, 0.7)' } }}
                    primaryTypographyProps={{ sx: { color: 'white', fontWeight: 600 } }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckCircleIcon sx={{ color: '#48CEDB' }} /></ListItemIcon>
                  <ListItemText 
                    primary="Priority Support"
                    secondary="Fast-track customer service for all enquiries"
                    secondaryTypographyProps={{ sx: { color: 'rgba(255, 255, 255, 0.7)' } }}
                    primaryTypographyProps={{ sx: { color: 'white', fontWeight: 600 } }}
                  />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>

          {/* Important Notes */}
          <Box sx={{ pl: 2, pr: 2, p: 2, bgcolor: 'rgba(255, 165, 0, 0.1)', borderLeft: '3px solid rgba(255, 165, 0, 0.5)', borderRadius: 1, mt: 2 }}>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: 600, mb: 1 }}>
              Important Insurance Terms:
            </Typography>
            <List dense>
              <ListItem sx={{ py: 0.25 }}>
                <ListItemIcon sx={{ minWidth: 28 }}><InfoIcon sx={{ color: 'rgba(255, 165, 0, 0.8)', fontSize: 18 }} /></ListItemIcon>
                <ListItemText 
                  primary="Gadget insurance covers laptops, smartphones, and tablets only"
                  primaryTypographyProps={{ sx: { color: 'rgba(255, 255, 255, 0.85)', fontSize: '0.85rem' } }}
                />
              </ListItem>
              <ListItem sx={{ py: 0.25 }}>
                <ListItemIcon sx={{ minWidth: 28 }}><InfoIcon sx={{ color: 'rgba(255, 165, 0, 0.8)', fontSize: 18 }} /></ListItemIcon>
                <ListItemText 
                  primary="Insurance is valid for 1 year from the gadget's purchase date"
                  primaryTypographyProps={{ sx: { color: 'rgba(255, 255, 255, 0.85)', fontSize: '0.85rem' } }}
                />
              </ListItem>
              <ListItem sx={{ py: 0.25 }}>
                <ListItemIcon sx={{ minWidth: 28 }}><InfoIcon sx={{ color: 'rgba(255, 165, 0, 0.8)', fontSize: 18 }} /></ListItemIcon>
                <ListItemText 
                  primary="Damage from misuse, negligence, or unauthorised repairs is not covered"
                  primaryTypographyProps={{ sx: { color: 'rgba(255, 255, 255, 0.85)', fontSize: '0.85rem' } }}
                />
              </ListItem>
              <ListItem sx={{ py: 0.25 }}>
                <ListItemIcon sx={{ minWidth: 28 }}><InfoIcon sx={{ color: 'rgba(255, 165, 0, 0.8)', fontSize: 18 }} /></ListItemIcon>
                <ListItemText 
                  primary="Subscription must be active at time of claim"
                  primaryTypographyProps={{ sx: { color: 'rgba(255, 255, 255, 0.85)', fontSize: '0.85rem' } }}
                />
              </ListItem>
              <ListItem sx={{ py: 0.25 }}>
                <ListItemIcon sx={{ minWidth: 28 }}><InfoIcon sx={{ color: 'rgba(255, 165, 0, 0.8)', fontSize: 18 }} /></ListItemIcon>
                <ListItemText 
                  primary="Cancel anytime – no long-term contracts"
                  primaryTypographyProps={{ sx: { color: 'rgba(255, 255, 255, 0.85)', fontSize: '0.85rem' } }}
                />
              </ListItem>
            </List>
          </Box>
        </CardContent>
      </PolicyCard>

      {/* Section 11 - Trade-In Program */}
      <PolicyCard>
        <CardContent>
          <SectionHeader variant="h5">11. Trade-In & Device Exchange Program</SectionHeader>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.85)', mb: 3 }}>
            Xtrapush Gadgets offers a comprehensive trade-in program where customers can exchange their old devices for value. We support three offer types:
          </Typography>

          <List>
            <ListItem>
              <ListItemIcon><CheckCircleIcon sx={{ color: '#48CEDB' }} /></ListItemIcon>
              <ListItemText 
                primary="💵 Cash Only: Receive direct payment via mobile money, bank transfer, or cash pickup"
                primaryTypographyProps={{ sx: { color: 'rgba(255, 255, 255, 0.85)', fontWeight: 600 } }}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><CheckCircleIcon sx={{ color: '#48CEDB' }} /></ListItemIcon>
              <ListItemText 
                primary="🔄 Swap Only: Exchange your device for a new gadget of equal or greater value (pay balance if applicable)"
                primaryTypographyProps={{ sx: { color: 'rgba(255, 255, 255, 0.85)', fontWeight: 600 } }}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><CheckCircleIcon sx={{ color: '#48CEDB' }} /></ListItemIcon>
              <ListItemText 
                primary="🔄💵 Both: Use trade-in credit toward a new device AND receive cash for remaining value"
                primaryTypographyProps={{ sx: { color: 'rgba(255, 255, 255, 0.85)', fontWeight: 600 } }}
              />
            </ListItem>
          </List>

          <Accordion defaultExpanded sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(5px)', mb: 2, '&:before': { display: 'none' } }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#48CEDB' }} />}>
              <Typography variant="h6" sx={{ color: '#48CEDB', fontWeight: 600 }}>11.1 Trade-In Process</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List sx={{ width: '100%' }}>
                <ListItem>
                  <ListItemIcon><InfoIcon sx={{ color: '#48CEDB' }} /></ListItemIcon>
                  <ListItemText 
                    primary="Quote Submission: Complete online assessment with device details, condition, and photos"
                    primaryTypographyProps={{ sx: { color: 'rgba(255, 255, 255, 0.85)' } }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><InfoIcon sx={{ color: '#48CEDB' }} /></ListItemIcon>
                  <ListItemText 
                    primary="Device Shipping: Ship device to us or schedule free pickup (Lilongwe only)"
                    primaryTypographyProps={{ sx: { color: 'rgba(255, 255, 255, 0.85)' } }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><InfoIcon sx={{ color: '#48CEDB' }} /></ListItemIcon>
                  <ListItemText 
                    primary="Inspection: Professional 50-point inspection within 24 hours of receipt"
                    primaryTypographyProps={{ sx: { color: 'rgba(255, 255, 255, 0.85)' } }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><InfoIcon sx={{ color: '#48CEDB' }} /></ListItemIcon>
                  <ListItemText 
                    primary="Final Quote: Receive updated quote if condition differs from assessment"
                    primaryTypographyProps={{ sx: { color: 'rgba(255, 255, 255, 0.85)' } }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><InfoIcon sx={{ color: '#48CEDB' }} /></ListItemIcon>
                  <ListItemText 
                    primary="Acceptance: Accept quote within 48 hours to receive payment or swap"
                    primaryTypographyProps={{ sx: { color: 'rgba(255, 255, 255, 0.85)' } }}
                  />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>

          <Accordion sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(5px)', mb: 2, '&:before': { display: 'none' } }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#48CEDB' }} />}>
              <Typography variant="h6" sx={{ color: '#48CEDB', fontWeight: 600 }}>11.2 Device Eligibility & Requirements</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List sx={{ width: '100%' }}>
                <ListItem>
                  <ListItemIcon><CheckCircleIcon sx={{ color: '#48CEDB' }} /></ListItemIcon>
                  <ListItemText 
                    primary="Accepted devices: Smartphones, tablets, laptops, gaming consoles, smartwatches, accessories"
                    primaryTypographyProps={{ sx: { color: 'rgba(255, 255, 255, 0.85)' } }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckCircleIcon sx={{ color: '#48CEDB' }} /></ListItemIcon>
                  <ListItemText 
                    primary="Must be genuine products (no counterfeit or replica devices)"
                    primaryTypographyProps={{ sx: { color: 'rgba(255, 255, 255, 0.85)' } }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckCircleIcon sx={{ color: '#48CEDB' }} /></ListItemIcon>
                  <ListItemText 
                    primary="Find My iPhone/Android Device Protection must be disabled before submission"
                    primaryTypographyProps={{ sx: { color: 'rgba(255, 255, 255, 0.85)' } }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckCircleIcon sx={{ color: '#48CEDB' }} /></ListItemIcon>
                  <ListItemText 
                    primary="Customer responsible for backing up and erasing personal data (we perform additional wipe)"
                    primaryTypographyProps={{ sx: { color: 'rgba(255, 255, 255, 0.85)' } }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckCircleIcon sx={{ color: '#48CEDB' }} /></ListItemIcon>
                  <ListItemText 
                    primary="Minimum trade-in value: MWK 20,000 or £10"
                    primaryTypographyProps={{ sx: { color: 'rgba(255, 255, 255, 0.85)' } }}
                  />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>

          <Accordion sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(5px)', mb: 2, '&:before': { display: 'none' } }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#48CEDB' }} />}>
              <Typography variant="h6" sx={{ color: '#48CEDB', fontWeight: 600 }}>11.3 Quote Adjustments & Disputes</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List sx={{ width: '100%' }}>
                <ListItem>
                  <ListItemIcon><InfoIcon sx={{ color: '#48CEDB' }} /></ListItemIcon>
                  <ListItemText 
                    primary="Final quote may differ from initial estimate if device condition does not match assessment"
                    primaryTypographyProps={{ sx: { color: 'rgba(255, 255, 255, 0.85)' } }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><InfoIcon sx={{ color: '#48CEDB' }} /></ListItemIcon>
                  <ListItemText 
                    primary="Customer has right to decline revised quote within 48 hours"
                    primaryTypographyProps={{ sx: { color: 'rgba(255, 255, 255, 0.85)' } }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><InfoIcon sx={{ color: '#48CEDB' }} /></ListItemIcon>
                  <ListItemText 
                    primary="Device return shipping fee applies if customer declines revised quote (MWK 5,000)"
                    primaryTypographyProps={{ sx: { color: 'rgba(255, 255, 255, 0.85)' } }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><InfoIcon sx={{ color: '#48CEDB' }} /></ListItemIcon>
                  <ListItemText 
                    primary="Devices not claimed within 30 days of declined quote become property of Xtrapush"
                    primaryTypographyProps={{ sx: { color: 'rgba(255, 255, 255, 0.85)' } }}
                  />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>

          <Accordion sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(5px)', '&:before': { display: 'none' } }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#48CEDB' }} />}>
              <Typography variant="h6" sx={{ color: '#48CEDB', fontWeight: 600 }}>11.4 Payment & Swap Terms</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List sx={{ width: '100%' }}>
                <ListItem>
                  <ListItemIcon><CheckCircleIcon sx={{ color: '#48CEDB' }} /></ListItemIcon>
                  <ListItemText 
                    primary="Cash payments processed within 3-5 business days after quote acceptance"
                    primaryTypographyProps={{ sx: { color: 'rgba(255, 255, 255, 0.85)' } }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckCircleIcon sx={{ color: '#48CEDB' }} /></ListItemIcon>
                  <ListItemText 
                    primary="Trade-in credit (store credit) applied immediately upon acceptance"
                    primaryTypographyProps={{ sx: { color: 'rgba(255, 255, 255, 0.85)' } }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckCircleIcon sx={{ color: '#48CEDB' }} /></ListItemIcon>
                  <ListItemText 
                    primary="Swap transactions require balance payment if new device value exceeds trade-in value"
                    primaryTypographyProps={{ sx: { color: 'rgba(255, 255, 255, 0.85)' } }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckCircleIcon sx={{ color: '#48CEDB' }} /></ListItemIcon>
                  <ListItemText 
                    primary="Trade-in credit valid for 12 months from issuance date"
                    primaryTypographyProps={{ sx: { color: 'rgba(255, 255, 255, 0.85)' } }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckCircleIcon sx={{ color: '#48CEDB' }} /></ListItemIcon>
                  <ListItemText 
                    primary="Bonus promotions (+10% credit bonus) apply only to store credit, not direct cash payments"
                    primaryTypographyProps={{ sx: { color: 'rgba(255, 255, 255, 0.85)' } }}
                  />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>

          <Box sx={{ pl: 2, pr: 2, p: 2, bgcolor: 'rgba(255, 165, 0, 0.1)', borderLeft: '3px solid rgba(255, 165, 0, 0.5)', borderRadius: 1, mt: 3 }}>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: 600, mb: 1 }}>
              Important Trade-In Notes:
            </Typography>
            <List dense>
              <ListItem sx={{ py: 0.25 }}>
                <ListItemIcon sx={{ minWidth: 28 }}><InfoIcon sx={{ color: 'rgba(255, 165, 0, 0.8)', fontSize: 18 }} /></ListItemIcon>
                <ListItemText 
                  primary="Xtrapush is not liable for data loss. Customers must backup and erase data before submission."
                  primaryTypographyProps={{ sx: { color: 'rgba(255, 255, 255, 0.85)', fontSize: '0.85rem' } }}
                />
              </ListItem>
              <ListItem sx={{ py: 0.25 }}>
                <ListItemIcon sx={{ minWidth: 28 }}><InfoIcon sx={{ color: 'rgba(255, 165, 0, 0.8)', fontSize: 18 }} /></ListItemIcon>
                <ListItemText 
                  primary="Devices with activation locks, stolen status, or blacklisted IMEIs will be rejected with no compensation."
                  primaryTypographyProps={{ sx: { color: 'rgba(255, 255, 255, 0.85)', fontSize: '0.85rem' } }}
                />
              </ListItem>
              <ListItem sx={{ py: 0.25 }}>
                <ListItemIcon sx={{ minWidth: 28 }}><InfoIcon sx={{ color: 'rgba(255, 165, 0, 0.8)', fontSize: 18 }} /></ListItemIcon>
                <ListItemText 
                  primary="AI-powered condition assessment is a guidance tool. Final human inspection determines value."
                  primaryTypographyProps={{ sx: { color: 'rgba(255, 255, 255, 0.85)', fontSize: '0.85rem' } }}
                />
              </ListItem>
              <ListItem sx={{ py: 0.25 }}>
                <ListItemIcon sx={{ minWidth: 28 }}><InfoIcon sx={{ color: 'rgba(255, 165, 0, 0.8)', fontSize: 18 }} /></ListItemIcon>
                <ListItemText 
                  primary="Trade-in values fluctuate based on market conditions and may change without notice."
                  primaryTypographyProps={{ sx: { color: 'rgba(255, 255, 255, 0.85)', fontSize: '0.85rem' } }}
                />
              </ListItem>
            </List>
          </Box>
        </CardContent>
      </PolicyCard>

      {/* Section 12 - Data & Privacy */}
      <PolicyCard>
        <CardContent>
          <SectionHeader variant="h5">12. Data & Privacy</SectionHeader>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.85)' }}>
            We collect and process personal data in accordance with our <strong>Privacy Policy</strong>. By using Xtrapush, you consent to such processing.
          </Typography>
        </CardContent>
      </PolicyCard>

      {/* Section 13 - Platform Use & Conduct */}
      <PolicyCard>
        <CardContent>
          <SectionHeader variant="h5">13. Platform Use & Conduct</SectionHeader>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.85)', mb: 2 }}>
            You agree not to:
          </Typography>
          <List>
            <ListItem>
              <ListItemIcon><GavelIcon sx={{ color: '#48CEDB' }} /></ListItemIcon>
              <ListItemText 
                primary="Provide false or misleading information"
                primaryTypographyProps={{ sx: { color: 'rgba(255, 255, 255, 0.85)' } }}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><GavelIcon sx={{ color: '#48CEDB' }} /></ListItemIcon>
              <ListItemText 
                primary="Attempt to bypass payment systems or device controls"
                primaryTypographyProps={{ sx: { color: 'rgba(255, 255, 255, 0.85)' } }}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><GavelIcon sx={{ color: '#48CEDB' }} /></ListItemIcon>
              <ListItemText 
                primary="Resell devices before ownership has transferred"
                primaryTypographyProps={{ sx: { color: 'rgba(255, 255, 255, 0.85)' } }}
              />
            </ListItem>
          </List>
        </CardContent>
      </PolicyCard>

      {/* Section 14 - Limitation of Liability */}
      <PolicyCard>
        <CardContent>
          <SectionHeader variant="h5">14. Limitation of Liability</SectionHeader>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.85)' }}>
            Xtrapush is not liable for indirect losses, loss of data, or loss of income arising from the use of a gadget, except where prohibited by law.
          </Typography>
        </CardContent>
      </PolicyCard>

      {/* Section 15 - Changes to These Terms */}
      <PolicyCard>
        <CardContent>
          <SectionHeader variant="h5">15. Changes to These Terms</SectionHeader>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.85)' }}>
            We may update these Terms at any time. The latest version will always be available on our website. 
            Continued use of Xtrapush constitutes acceptance of the updated Terms.
          </Typography>
        </CardContent>
      </PolicyCard>

      {/* Section 16 - Governing Law */}
      <PolicyCard>
        <CardContent>
          <SectionHeader variant="h5">16. Governing Law</SectionHeader>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.85)' }}>
            These Terms are governed by the laws applicable in the jurisdiction where Xtrapush operates, unless otherwise required by law.
          </Typography>
        </CardContent>
      </PolicyCard>

      {/* Section 17 - Contact Us */}
      <PolicyCard>
        <CardContent>
          <SectionHeader variant="h5">17. Contact Us</SectionHeader>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.85)', mb: 2 }}>
            For questions about these Terms or your installment agreement, contact:
          </Typography>
          <Paper sx={{ p: 2.5, bgcolor: 'rgba(72, 206, 219, 0.1)', border: '1px solid rgba(72, 206, 219, 0.3)', borderRadius: 2 }}>
            <Typography variant="h6" sx={{ color: '#48CEDB', fontWeight: 600, mb: 1.5 }}>
              🤝 Xtrapush Gadgets Support
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <EmailIcon sx={{ color: '#48CEDB', fontSize: 20 }} />
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.85)' }}>
                Email: <Link href="mailto:conrad@itsxtrapush.com" sx={{ color: '#48CEDB', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                  conrad@itsxtrapush.com
                </Link>
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.85)' }}>
              Website: <Link href="https://xtrapushgadgets.com" target="_blank" rel="noopener noreferrer" sx={{ color: '#48CEDB', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                https://xtrapushgadgets.com
              </Link>
            </Typography>
          </Paper>
        </CardContent>
      </PolicyCard>

      {/* Footer Notice */}
      <Box sx={{ mt: 4, p: 3, bgcolor: 'rgba(255, 165, 0, 0.1)', border: '1px solid rgba(255, 165, 0, 0.3)', borderRadius: 2, textAlign: 'center' }}>
        <Typography variant="caption" sx={{ color: 'rgba(255, 165, 0, 0.95)', fontStyle: 'italic' }}>
          <strong>Legal Notice:</strong> This document is a sample and should be reviewed by a qualified legal professional before official use. 
          Please ensure all terms are compliant with your local jurisdiction and business requirements.
        </Typography>
      </Box>
    </Container>
  );
};

export default TermsPolicy;
