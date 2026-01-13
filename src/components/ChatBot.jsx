import React, { useState, useEffect } from 'react';
import { Box, Fab, Paper, Typography, TextField, Button, IconButton, Collapse } from '@mui/material';
import { Chat, Close, Send, SupportAgent } from '@mui/icons-material';
import { robot } from '../assets';
import { useNavigate } from 'react-router-dom';

const ChatBot = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [showQuickQuestions, setShowQuickQuestions] = useState(true);

  const quickQuestions = [
    "What products do you sell?",
    "How does trade-in work?",
    "What's your return policy?",
    "Do you offer warranty?",
    "How can I contact support?"
  ];

  const quickAnswers = {
    "What products do you sell?": "We sell refurbished gadgets, tech devices, phones, laptops, and more. Check our Gadgets and Tech sections for our full catalog!",
    "How does trade-in work?": "Our trade-in process is simple: 1) Get an instant quote, 2) Ship your device for free, 3) Get paid once we verify the condition. Click 'Contact Admin' below to start!",
    "What's your return policy?": "We offer a 30-day return policy on all items. Products must be in original condition. Check our Return Policy page for full details.",
    "Do you offer warranty?": "Yes! All our refurbished devices come with a warranty. Visit our Warranty page to learn more about coverage and terms.",
    "How can I contact support?": "You can reach our support team through the Contact page, or click 'Contact Admin' below for direct assistance."
  };

  useEffect(() => {
    // Show welcome message after 3 seconds
    const timer = setTimeout(() => {
      setShowWelcome(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Hide welcome message after 5 seconds if not clicked
    if (showWelcome && !isOpen) {
      const timer = setTimeout(() => {
        setShowWelcome(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [showWelcome, isOpen]);

  const handleOpen = () => {
    setIsOpen(true);
    setShowWelcome(false);
    if (messages.length === 0) {
      setMessages([{
        type: 'bot',
        text: '👋 Hi there! Welcome to XtraPush! I\'m here to help you with any questions about our products, trade-ins, or services. How can I assist you today?',
        timestamp: new Date()
      }]);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleQuickQuestion = (question) => {
    const answer = quickAnswers[question];
    setMessages(prev => [
      ...prev,
      { type: 'user', text: question, timestamp: new Date() },
      { type: 'bot', text: answer, timestamp: new Date() }
    ]);
    setShowQuickQuestions(false);
  };

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      setMessages(prev => [
        ...prev,
        { type: 'user', text: inputValue, timestamp: new Date() },
        { 
          type: 'bot', 
          text: 'Thanks for your message! For detailed assistance, please contact our admin team using the "Contact Admin" button below, or visit our Help page.',
          timestamp: new Date() 
        }
      ]);
      setInputValue('');
    }
  };

  const handleContactAdmin = () => {
    navigate('/contact');
  };

  return (
    <>
      {/* Welcome Message Popup */}
      <Collapse in={showWelcome && !isOpen}>
        <Paper
          sx={{
            position: 'fixed',
            bottom: 100,
            right: 20,
            p: 2,
            maxWidth: 280,
            backgroundColor: '#48CEDB',
            color: 'white',
            borderRadius: 2,
            cursor: 'pointer',
            zIndex: 1000,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
          }}
          onClick={handleOpen}
        >
          <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
            👋 Hi! Need help?
          </Typography>
          <Typography variant="caption">
            Click here to chat with our support bot!
          </Typography>
        </Paper>
      </Collapse>

      {/* Chat Window */}
      <Collapse in={isOpen}>
        <Paper
          sx={{
            position: 'fixed',
            bottom: 100,
            right: 20,
            width: 350,
            height: 450,
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1000,
            borderRadius: 2,
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
          }}
        >
          {/* Header */}
          <Box
            sx={{
              backgroundColor: '#48CEDB',
              color: 'white',
              p: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <img src={robot} alt="Bot" style={{ width: 24, height: 24 }} />
              <Typography variant="h6" sx={{ fontSize: '1rem' }}>
                XtraPush Support
              </Typography>
            </Box>
            <IconButton onClick={handleClose} sx={{ color: 'white' }}>
              <Close />
            </IconButton>
          </Box>

          {/* Messages */}
          <Box
            sx={{
              flex: 1,
              p: 2,
              overflowY: 'auto',
              backgroundColor: '#f5f5f5'
            }}
          >
            {messages.map((message, index) => (
              <Box
                key={index}
                sx={{
                  mb: 2,
                  display: 'flex',
                  justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start'
                }}
              >
                <Paper
                  sx={{
                    p: 1.5,
                    maxWidth: '80%',
                    backgroundColor: message.type === 'user' ? '#48CEDB' : 'white',
                    color: message.type === 'user' ? 'white' : 'black'
                  }}
                >
                  <Typography variant="body2">{message.text}</Typography>
                </Paper>
              </Box>
            ))}

            {/* Quick Questions */}
            {showQuickQuestions && messages.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" sx={{ color: 'gray', mb: 1, display: 'block' }}>
                  Quick questions:
                </Typography>
                {quickQuestions.map((question, index) => (
                  <Button
                    key={index}
                    variant="outlined"
                    size="small"
                    onClick={() => handleQuickQuestion(question)}
                    sx={{
                      mb: 1,
                      mr: 1,
                      fontSize: '0.75rem',
                      textTransform: 'none',
                      borderColor: '#48CEDB',
                      color: '#48CEDB',
                      '&:hover': {
                        backgroundColor: '#48CEDB',
                        color: 'white'
                      }
                    }}
                  >
                    {question}
                  </Button>
                ))}
              </Box>
            )}
          </Box>

          {/* Input Area */}
          <Box sx={{ p: 2, backgroundColor: 'white', borderTop: '1px solid #eee' }}>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Type your message..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <IconButton onClick={handleSendMessage} sx={{ color: '#48CEDB' }}>
                <Send />
              </IconButton>
            </Box>
            <Button
              fullWidth
              variant="contained"
              startIcon={<SupportAgent />}
              onClick={handleContactAdmin}
              sx={{
                backgroundColor: '#48CEDB',
                '&:hover': { backgroundColor: '#3ba8b5' },
                textTransform: 'none'
              }}
            >
              Contact Admin
            </Button>
          </Box>
        </Paper>
      </Collapse>

      {/* Floating Action Button */}
      <Fab
        sx={{
          position: 'fixed',
          bottom: 110,
          right: 20,
          backgroundColor: '#48CEDB',
          color: 'white',
          zIndex: 1000,
          '&:hover': {
            backgroundColor: '#3ba8b5'
          }
        }}
        onClick={isOpen ? handleClose : handleOpen}
      >
        {isOpen ? <Close /> : <Chat />}
      </Fab>
    </>
  );
};

export default ChatBot;