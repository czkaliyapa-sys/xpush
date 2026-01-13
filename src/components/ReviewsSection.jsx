import React, { useEffect, useMemo, useState } from 'react';
import { 
  Box, 
  Typography, 
  Rating, 
  TextField, 
  Button, 
  IconButton, 
  Divider, 
  Stack,
  LinearProgress,
  Chip,
  Avatar,
  Card,
  CardContent,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Tooltip,
  Collapse
} from '@mui/material';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbUpOutlinedIcon from '@mui/icons-material/ThumbUpOutlined';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import ThumbDownOutlinedIcon from '@mui/icons-material/ThumbDownOutlined';
import VerifiedIcon from '@mui/icons-material/Verified';
import StarIcon from '@mui/icons-material/Star';
import FilterListIcon from '@mui/icons-material/FilterList';
import ReplyIcon from '@mui/icons-material/Reply';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { motion, AnimatePresence } from 'framer-motion';
import { gadgetsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

export default function ReviewsSection({ gadgetId }) {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(null);
  const [ratingCount, setRatingCount] = useState(0);
  const [sortBy, setSortBy] = useState('recent');
  const [filterRating, setFilterRating] = useState('all');

  const [newComment, setNewComment] = useState('');
  const [newRating, setNewRating] = useState(0);
  const [replyDrafts, setReplyDrafts] = useState({});
  const [replySubmitting, setReplySubmitting] = useState({});
  const [expandedReviews, setExpandedReviews] = useState({});

  const canPost = isAuthenticated && newRating > 0 && newComment.trim().length > 0;

  const fetchReviews = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await gadgetsAPI.getReviews(gadgetId);
      if (res?.success) {
        const payload = res.data || {};
        const list = Array.isArray(payload.reviews) ? payload.reviews : [];
        setReviews(list);
        const providedAvg = typeof payload.averageRating !== 'undefined' ? payload.averageRating : null;
        const providedCount = typeof payload.count !== 'undefined' ? payload.count : undefined;
        if (providedAvg !== null && typeof providedCount !== 'undefined') {
          setAvgRating(providedAvg);
          setRatingCount(Number(providedCount) || 0);
        } else {
          const ratings = list
            .map(r => Number(r.rating))
            .filter(n => Number.isFinite(n) && n > 0);
          const count = ratings.length;
          const avg = count > 0 ? (ratings.reduce((a, b) => a + b, 0) / count).toFixed(1) : null;
          setAvgRating(avg ? Number(avg) : null);
          setRatingCount(count);
        }
      } else {
        setError('Failed to load reviews');
      }
    } catch (e) {
      setError('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!gadgetId) return;
    fetchReviews();
  }, [gadgetId]);

  const handleCreateReview = async () => {
    if (!isAuthenticated) {
      navigate('/signin');
      return;
    }
    if (!canPost) return;
    setSubmitting(true);
    setError(null);
    try {
      await gadgetsAPI.createReview(gadgetId, {
        userUid: user?.uid,
        comment: newComment.trim(),
        rating: newRating
      });
      setNewComment('');
      setNewRating(0);
      await fetchReviews();
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to post review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReact = async (reviewId, reaction) => {
    if (!isAuthenticated) {
      navigate('/signin');
      return;
    }
    try {
      await gadgetsAPI.reactToReview(reviewId, { userUid: user?.uid, reaction });
      await fetchReviews();
    } catch (e) {
      // ignore
    }
  };

  const handleReply = async (reviewId) => {
    if (!isAuthenticated) {
      navigate('/signin');
      return;
    }
    const text = (replyDrafts[reviewId] || '').trim();
    if (!text) return;
    setReplySubmitting(prev => ({ ...prev, [reviewId]: true }));
    try {
      await gadgetsAPI.replyToReview(reviewId, { userUid: user?.uid, comment: text });
      setReplyDrafts(prev => ({ ...prev, [reviewId]: '' }));
      await fetchReviews();
    } catch (e) {
      // best-effort
    } finally {
      setReplySubmitting(prev => ({ ...prev, [reviewId]: false }));
    }
  };

  const header = useMemo(() => {
    if (avgRating === null) return 'No ratings yet';
    return `${avgRating} out of 5 (${ratingCount} rating${ratingCount === 1 ? '' : 's'})`;
  }, [avgRating, ratingCount]);

  const ratingDistribution = useMemo(() => {
    if (reviews.length === 0) return { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(r => {
      const rating = Number(r.rating);
      if (rating >= 1 && rating <= 5) dist[rating]++;
    });
    return dist;
  }, [reviews]);

  const processedReviews = useMemo(() => {
    let filtered = [...reviews];
    
    if (filterRating !== 'all') {
      const targetRating = parseInt(filterRating);
      filtered = filtered.filter(r => Number(r.rating) === targetRating);
    }
    
    filtered.sort((a, b) => {
      if (sortBy === 'recent') {
        return new Date(b.createdAt) - new Date(a.createdAt);
      } else if (sortBy === 'highest') {
        return Number(b.rating) - Number(a.rating);
      } else if (sortBy === 'lowest') {
        return Number(a.rating) - Number(b.rating);
      } else if (sortBy === 'helpful') {
        return (b.likesCount || 0) - (a.likesCount || 0);
      }
      return 0;
    });
    
    return filtered;
  }, [reviews, sortBy, filterRating]);

  const getInitials = (name) => {
    return name
      .split('*')[0]
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Box sx={{
      mt: 4,
      px: { xs: 2, sm: 3, md: 4 },
      py: 3,
      bgcolor: 'rgba(15, 23, 42, 0.6)',
      borderRadius: 3,
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255,255,255,0.1)'
    }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
          <StarIcon sx={{ color: '#ffd700', fontSize: 32 }} />
          <Typography variant="h4" sx={{ color: '#fff', fontWeight: 'bold' }}>
            Reviews & Ratings
          </Typography>
        </Stack>
        
        {/* Rating Summary */}
        <Card sx={{ 
          bgcolor: 'rgba(30, 41, 59, 0.8)', 
          borderRadius: 2,
          border: '1px solid rgba(255,255,255,0.15)'
        }}>
          <CardContent>
            <Stack 
              direction={{ xs: 'column', md: 'row' }} 
              spacing={4} 
              divider={<Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />}
            >
              <Box sx={{ flex: 1, textAlign: 'center' }}>
                <Typography variant="h2" sx={{ color: '#fff', fontWeight: 'bold', mb: 1 }}>
                  {avgRating !== null ? avgRating.toFixed(1) : '0.0'}
                </Typography>
                <Rating 
                  value={avgRating || 0} 
                  readOnly 
                  precision={0.1} 
                  size="large"
                  sx={{
                    '& .MuiRating-iconFilled': { color: '#ffd700' },
                    '& .MuiRating-iconEmpty': { color: 'rgba(255,255,255,0.2)' }
                  }}
                />
                <Typography variant="body2" sx={{ color: '#94a3b8', mt: 1 }}>
                  {ratingCount} {ratingCount === 1 ? 'review' : 'reviews'}
                </Typography>
              </Box>

              <Box sx={{ flex: 2 }}>
                {[5, 4, 3, 2, 1].map(star => {
                  const count = ratingDistribution[star] || 0;
                  const percentage = ratingCount > 0 ? (count / ratingCount) * 100 : 0;
                  return (
                    <Stack 
                      key={star} 
                      direction="row" 
                      alignItems="center" 
                      spacing={2} 
                      sx={{ 
                        mb: 1,
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' },
                        borderRadius: 1,
                        px: 1,
                        py: 0.5
                      }}
                      onClick={() => setFilterRating(star.toString())}
                    >
                      <Typography variant="body2" sx={{ color: '#fff', minWidth: 60 }}>
                        {star} <StarIcon sx={{ fontSize: 14, color: '#ffd700', verticalAlign: 'middle' }} />
                      </Typography>
                      <Box sx={{ flex: 1 }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={percentage} 
                          sx={{
                            height: 8,
                            borderRadius: 1,
                            bgcolor: 'rgba(255,255,255,0.1)',
                            '& .MuiLinearProgress-bar': {
                              bgcolor: star >= 4 ? '#10b981' : star >= 3 ? '#fbbf24' : '#ef4444',
                              borderRadius: 1
                            }
                          }}
                        />
                      </Box>
                      <Typography variant="body2" sx={{ color: '#94a3b8', minWidth: 80, textAlign: 'right' }}>
                        {count} {count === 1 ? 'review' : 'reviews'}
                      </Typography>
                    </Stack>
                  );
                })}
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Box>

      {/* Write Review */}
      <Card sx={{ 
        bgcolor: 'rgba(30, 41, 59, 0.8)', 
        borderRadius: 2,
        border: '1px solid rgba(255,255,255,0.15)',
        mb: 4
      }}>
        <CardContent>
          <Typography variant="h6" sx={{ color: '#fff', mb: 2, fontWeight: 600 }}>
            ✍️ Write Your Review
          </Typography>
          <Stack spacing={2}>
            <Box>
              <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1 }}>
                Your Rating *
              </Typography>
              <Rating
                value={newRating}
                onChange={(_, v) => setNewRating(v || 0)}
                size="large"
                sx={{
                  '& .MuiRating-iconFilled': { color: '#ffd700' },
                  '& .MuiRating-iconHover': { color: '#ffeb3b' },
                  '& .MuiRating-iconEmpty': { color: 'rgba(255,255,255,0.2)' }
                }}
              />
            </Box>
            <TextField
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={isAuthenticated ? 'Share your experience with this product...' : 'Please sign in to write a review'}
              fullWidth
              multiline
              rows={4}
              disabled={!isAuthenticated || submitting}
              sx={{
                '& .MuiInputBase-root': {
                  bgcolor: 'rgba(255,255,255,0.9)',
                  color: '#000',
                  borderRadius: 2,
                  fontSize: '0.95rem'
                },
                '& .MuiInputBase-root.Mui-disabled': {
                  bgcolor: 'rgba(255,255,255,0.5)',
                  color: '#666'
                },
                '& .MuiInputBase-input::placeholder': { 
                  color: '#666', 
                  opacity: 0.7 
                },
                '& .MuiOutlinedInput-notchedOutline': { 
                  borderColor: 'rgba(255,255,255,0.3)' 
                },
                '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': { 
                  borderColor: 'rgba(72,206,219,0.5)' 
                },
                '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { 
                  borderColor: '#48CEDB',
                  borderWidth: 2
                }
              }}
            />
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              {!isAuthenticated && (
                <Button
                  variant="outlined"
                  onClick={() => navigate('/signin')}
                  sx={{
                    color: '#48CEDB',
                    borderColor: '#48CEDB',
                    textTransform: 'none',
                    '&:hover': {
                      borderColor: '#39B9C7',
                      bgcolor: 'rgba(72,206,219,0.1)'
                    }
                  }}
                >
                  Sign In to Review
                </Button>
              )}
              {isAuthenticated && (
                <Button
                  variant="contained"
                  onClick={handleCreateReview}
                  disabled={!canPost || submitting}
                  startIcon={submitting ? null : <StarIcon />}
                  sx={{
                    bgcolor: '#48CEDB',
                    color: '#fff',
                    px: 3,
                    py: 1,
                    fontWeight: 600,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontSize: '1rem',
                    '&:hover': {
                      bgcolor: '#39B9C7',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(72,206,219,0.4)'
                    },
                    '&.Mui-disabled': {
                      bgcolor: 'rgba(72,206,219,0.3)',
                      color: 'rgba(255,255,255,0.6)'
                    },
                    transition: 'all 0.2s'
                  }}
                >
                  {submitting ? 'Posting...' : 'Post Review'}
                </Button>
              )}
            </Stack>
            {error && (
              <Typography variant="caption" sx={{ color: '#ef4444', mt: 1 }}>
                ❌ {error}
              </Typography>
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* Filter & Sort */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel sx={{ color: '#94a3b8' }}>Filter by Rating</InputLabel>
          <Select
            value={filterRating}
            label="Filter by Rating"
            onChange={(e) => setFilterRating(e.target.value)}
            startAdornment={<FilterListIcon sx={{ color: '#94a3b8', mr: 1 }} />}
            sx={{
              color: '#fff',
              '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
              '& .MuiSvgIcon-root': { color: '#fff' },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' }
            }}
            MenuProps={{
              PaperProps: { sx: { bgcolor: '#1e293b', color: '#fff' } }
            }}
          >
            <MenuItem value="all">All Ratings</MenuItem>
            <MenuItem value="5">5 Stars</MenuItem>
            <MenuItem value="4">4 Stars</MenuItem>
            <MenuItem value="3">3 Stars</MenuItem>
            <MenuItem value="2">2 Stars</MenuItem>
            <MenuItem value="1">1 Star</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel sx={{ color: '#94a3b8' }}>Sort By</InputLabel>
          <Select
            value={sortBy}
            label="Sort By"
            onChange={(e) => setSortBy(e.target.value)}
            sx={{
              color: '#fff',
              '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
              '& .MuiSvgIcon-root': { color: '#fff' },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' }
            }}
            MenuProps={{
              PaperProps: { sx: { bgcolor: '#1e293b', color: '#fff' } }
            }}
          >
            <MenuItem value="recent">Most Recent</MenuItem>
            <MenuItem value="highest">Highest Rated</MenuItem>
            <MenuItem value="lowest">Lowest Rated</MenuItem>
            <MenuItem value="helpful">Most Helpful</MenuItem>
          </Select>
        </FormControl>

        {filterRating !== 'all' && (
          <Button
            variant="outlined"
            size="small"
            onClick={() => setFilterRating('all')}
            sx={{
              color: '#94a3b8',
              borderColor: 'rgba(255,255,255,0.2)',
              textTransform: 'none',
              '&:hover': {
                borderColor: 'rgba(255,255,255,0.3)',
                bgcolor: 'rgba(255,255,255,0.05)'
              }
            }}
          >
            Clear Filter
          </Button>
        )}
      </Stack>

      {/* Reviews List */}
      {loading ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography sx={{ color: '#94a3b8' }}>Loading reviews...</Typography>
        </Box>
      ) : processedReviews.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography sx={{ color: '#94a3b8', mb: 2 }}>
            {filterRating !== 'all' 
              ? `No ${filterRating}-star reviews yet.` 
              : 'No reviews yet. Be the first to review!'}
          </Typography>
          {filterRating !== 'all' && (
            <Button
              variant="outlined"
              onClick={() => setFilterRating('all')}
              sx={{
                color: '#48CEDB',
                borderColor: '#48CEDB',
                textTransform: 'none'
              }}
            >
              View All Reviews
            </Button>
          )}
        </Box>
      ) : (
        <Stack spacing={3}>
          <AnimatePresence>
            {processedReviews.map((r, index) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card sx={{
                  bgcolor: 'rgba(30, 41, 59, 0.5)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 2,
                  '&:hover': {
                    bgcolor: 'rgba(30, 41, 59, 0.7)',
                    border: '1px solid rgba(255,255,255,0.2)'
                  },
                  transition: 'all 0.2s'
                }}>
                  <CardContent>
                    <Stack direction="row" spacing={2}>
                      <Avatar sx={{ 
                        bgcolor: '#48CEDB', 
                        width: 48, 
                        height: 48,
                        fontWeight: 'bold'
                      }}>
                        {getInitials(r.userMasked)}
                      </Avatar>
                      
                      <Box sx={{ flex: 1 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
                          <Box>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Typography variant="subtitle1" sx={{ color: '#fff', fontWeight: 600 }}>
                                {r.userMasked}
                              </Typography>
                              <Tooltip title="Verified Purchase">
                                <VerifiedIcon sx={{ fontSize: 16, color: '#10b981' }} />
                              </Tooltip>
                            </Stack>
                            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                              {new Date(r.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </Typography>
                          </Box>
                          
                          <Rating 
                            value={r.rating || 0} 
                            readOnly 
                            size="small"
                            sx={{
                              '& .MuiRating-iconFilled': { color: '#ffd700' },
                              '& .MuiRating-iconEmpty': { color: 'rgba(255,255,255,0.2)' }
                            }}
                          />
                        </Stack>

                        <Typography variant="body1" sx={{ color: '#e2e8f0', mb: 2, lineHeight: 1.7 }}>
                          {r.comment}
                        </Typography>

                        {/* Helpful/Not Helpful */}
                        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                          <Tooltip title="Helpful">
                            <IconButton 
                              size="small" 
                              onClick={() => handleReact(r.id, 'like')}
                              sx={{ 
                                color: '#94a3b8',
                                '&:hover': { color: '#10b981', bgcolor: 'rgba(16,185,129,0.1)' }
                              }}
                            >
                              <ThumbUpOutlinedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                            {r.likesCount || 0}
                          </Typography>

                          <Tooltip title="Not Helpful">
                            <IconButton 
                              size="small" 
                              onClick={() => handleReact(r.id, 'dislike')}
                              sx={{ 
                                color: '#94a3b8',
                                '&:hover': { color: '#ef4444', bgcolor: 'rgba(239,68,68,0.1)' }
                              }}
                            >
                              <ThumbDownOutlinedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                            {r.dislikesCount || 0}
                          </Typography>

                          <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />

                          <Button
                            size="small"
                            startIcon={<ReplyIcon />}
                            onClick={() => setExpandedReviews(prev => ({ ...prev, [r.id]: !prev[r.id] }))}
                            sx={{
                              color: '#48CEDB',
                              textTransform: 'none',
                              '&:hover': { bgcolor: 'rgba(72,206,219,0.1)' }
                            }}
                          >
                            Reply {r.replies?.length > 0 && `(${r.replies.length})`}
                          </Button>
                        </Stack>

                        {/* Replies */}
                        <Collapse in={expandedReviews[r.id] || (r.replies && r.replies.length > 0)}>
                          {r.replies && r.replies.length > 0 && (
                            <Box sx={{ pl: 3, borderLeft: '2px solid rgba(72,206,219,0.3)', mb: 2 }}>
                              {r.replies.map((rep) => (
                                <Box key={rep.id} sx={{ mb: 2 }}>
                                  <Stack direction="row" spacing={1.5}>
                                    <Avatar sx={{ bgcolor: '#94a3b8', width: 32, height: 32, fontSize: '0.875rem' }}>
                                      {getInitials(rep.userMasked)}
                                    </Avatar>
                                    <Box sx={{ flex: 1 }}>
                                      <Typography variant="caption" sx={{ color: '#fff', fontWeight: 600 }}>
                                        {rep.userMasked}
                                      </Typography>
                                      <Typography variant="caption" sx={{ color: '#94a3b8', ml: 1 }}>
                                        {new Date(rep.createdAt).toLocaleDateString()}
                                      </Typography>
                                      <Typography variant="body2" sx={{ color: '#cbd5e1', mt: 0.5 }}>
                                        {rep.comment}
                                      </Typography>
                                    </Box>
                                  </Stack>
                                </Box>
                              ))}
                            </Box>
                          )}

                          {/* Reply Input */}
                          {isAuthenticated && (
                            <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                              <TextField
                                value={replyDrafts[r.id] || ''}
                                onChange={(e) => setReplyDrafts(prev => ({ ...prev, [r.id]: e.target.value }))}
                                placeholder="Write a reply..."
                                fullWidth
                                size="small"
                                disabled={!!replySubmitting[r.id]}
                                sx={{
                                  '& .MuiInputBase-root': {
                                    bgcolor: 'rgba(255,255,255,0.9)',
                                    color: '#000',
                                    borderRadius: 1
                                  },
                                  '& .MuiOutlinedInput-notchedOutline': { 
                                    borderColor: 'rgba(255,255,255,0.2)' 
                                  }
                                }}
                              />
                              <Button
                                variant="contained"
                                onClick={() => handleReply(r.id)}
                                disabled={!replyDrafts[r.id]?.trim() || !!replySubmitting[r.id]}
                                sx={{
                                  bgcolor: '#48CEDB',
                                  minWidth: 80,
                                  textTransform: 'none',
                                  '&:hover': { bgcolor: '#39B9C7' },
                                  '&.Mui-disabled': {
                                    bgcolor: 'rgba(72,206,219,0.3)',
                                    color: 'rgba(255,255,255,0.6)'
                                  }
                                }}
                              >
                                {replySubmitting[r.id] ? 'Sending...' : 'Reply'}
                              </Button>
                            </Stack>
                          )}
                        </Collapse>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </Stack>
      )}
    </Box>
  );
}
