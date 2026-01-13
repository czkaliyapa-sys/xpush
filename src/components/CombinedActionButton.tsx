import * as React from 'react';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';

export interface CombinedActionButtonProps {
  onAddToCart: (e: React.MouseEvent) => void;
  addDisabled?: boolean;
  priceLabel?: string;
}

/**
 * CombinedActionButton
 * A single, unified control with two clear segments: Add to Cart and Price Display.
 * - Blue-black outer parent with subtle 3D shadow
 * - Raises slightly on hover/press for a 3D feel
 * - Clear divider between segments for clarity
 */
const CombinedActionButton: React.FC<CombinedActionButtonProps> = ({
  onAddToCart,
  addDisabled = false,
  priceLabel = '',
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'stretch',
        width: '100%',
        borderRadius: '12px',
        overflow: 'hidden',
        // Blue-black gradient outer parent
        background: 'linear-gradient(180deg, #0b1220 0%, #050a14 100%)',
        boxShadow: '0 10px 24px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        transition: 'transform 160ms ease, box-shadow 160ms ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 14px 28px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.06)'
        },
        '&:active': {
          transform: 'translateY(-1px)',
          boxShadow: '0 12px 26px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
        },
      }}
    >
      {/* Add to Cart segment - Left side with cart icon */}
      <ButtonBase
        onClick={onAddToCart}
        disabled={addDisabled}
        sx={{
          flex: 0,
          minWidth: 44,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 0,
          px: 1.5,
          py: 1.25,
          color: addDisabled ? 'rgba(255,255,255,0.6)' : 'white',
          transition: 'background-color 160ms ease',
          '&:hover': { backgroundColor: addDisabled ? 'transparent' : 'rgba(59, 130, 246, 0.15)' },
          '&:active': { backgroundColor: addDisabled ? 'transparent' : 'rgba(59, 130, 246, 0.25)' },
          opacity: addDisabled ? 0.8 : 1,
        }}
      >
        <AddShoppingCartIcon sx={{ color: addDisabled ? 'rgba(255,255,255,0.6)' : 'white' }} aria-label="Add to cart" />
      </ButtonBase>

      {/* Divider for clarity */}
      <Box
        sx={{
          width: '1px',
          backgroundColor: 'rgba(255, 255, 255, 0.15)',
        }}
      />

      {/* Price display segment - Right side with "From [price]" */}
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
          px: 2.5,
          py: 1.25,
          color: addDisabled ? 'rgba(255,255,255,0.6)' : 'white',
          opacity: addDisabled ? 0.8 : 1,
        }}
      >
        {priceLabel && (
          <Typography
            variant="body2"
            fontWeight={700}
            sx={{ whiteSpace: 'nowrap' }}
          >
            {priceLabel}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default CombinedActionButton;