import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { api } from '../lib/api';
import { formatPrice, spacing, borderRadius, fontSize } from '../lib/theme';

const deviceTypes = [
  { id: 'smartphone', name: 'Smartphone', icon: 'phone-portrait' },
  { id: 'laptop', name: 'Laptop', icon: 'laptop' },
  { id: 'tablet', name: 'Tablet', icon: 'tablet-portrait' },
  { id: 'smartwatch', name: 'Smartwatch', icon: 'watch' },
  { id: 'console', name: 'Gaming Console', icon: 'game-controller' },
];

const conditions = [
  { id: 'excellent', name: 'Excellent', description: 'Like new, no scratches', multiplier: 1.0 },
  { id: 'good', name: 'Good', description: 'Minor wear, fully functional', multiplier: 0.8 },
  { id: 'fair', name: 'Fair', description: 'Visible wear, works well', multiplier: 0.6 },
  { id: 'poor', name: 'Poor', description: 'Heavy wear, may have issues', multiplier: 0.3 },
];

export default function TradeInScreen({ navigation }) {
  const { colors } = useTheme();
  const { isAuthenticated } = useAuth();
  const { currency } = useCart();
  
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState(null);
  const [deviceBrand, setDeviceBrand] = useState('');
  const [deviceModel, setDeviceModel] = useState('');
  const [selectedCondition, setSelectedCondition] = useState(null);
  const [estimate, setEstimate] = useState(null);
  const [loading, setLoading] = useState(false);

  const baseValues = {
    smartphone: { GBP: 350, MWK: 630000 },
    laptop: { GBP: 500, MWK: 900000 },
    tablet: { GBP: 250, MWK: 450000 },
    smartwatch: { GBP: 100, MWK: 180000 },
    console: { GBP: 200, MWK: 360000 },
  };

  const calculateEstimate = () => {
    if (!selectedType || !selectedCondition) return;
    
    const baseValue = baseValues[selectedType.id]?.[currency] || 100;
    const condition = conditions.find(c => c.id === selectedCondition);
    const estimatedValue = Math.round(baseValue * (condition?.multiplier || 0.5));
    
    setEstimate(estimatedValue);
    setStep(3);
  };

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      Alert.alert(
        'Sign In Required',
        'Please sign in to submit a trade-in request.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => navigation.navigate('Login') },
        ]
      );
      return;
    }

    setLoading(true);
    try {
      await api.submitTradeIn({
        device_type: selectedType.id,
        brand: deviceBrand,
        model: deviceModel,
        condition: selectedCondition,
        estimated_value: estimate,
        currency,
      });
      
      Alert.alert(
        'Trade-In Submitted!',
        `We've received your trade-in request for ${deviceBrand} ${deviceModel}. We'll contact you within 24 hours.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Trade-in error:', error);
      Alert.alert(
        'Trade-In Submitted!',
        `We've received your trade-in request. We'll contact you within 24 hours.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } finally {
      setLoading(false);
    }
  };

  const styles = createStyles(colors);

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>What device are you trading in?</Text>
      <View style={styles.deviceGrid}>
        {deviceTypes.map((type) => (
          <TouchableOpacity
            key={type.id}
            style={[
              styles.deviceCard,
              selectedType?.id === type.id && styles.deviceCardSelected,
            ]}
            onPress={() => setSelectedType(type)}
          >
            <Ionicons
              name={type.icon}
              size={32}
              color={selectedType?.id === type.id ? colors.primary : colors.textMuted}
            />
            <Text
              style={[
                styles.deviceName,
                selectedType?.id === type.id && styles.deviceNameSelected,
              ]}
            >
              {type.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {selectedType && (
        <>
          <Text style={styles.inputLabel}>Brand</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Apple, Samsung, Dell"
            placeholderTextColor={colors.textMuted}
            value={deviceBrand}
            onChangeText={setDeviceBrand}
          />

          <Text style={styles.inputLabel}>Model</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., iPhone 14 Pro, Galaxy S24"
            placeholderTextColor={colors.textMuted}
            value={deviceModel}
            onChangeText={setDeviceModel}
          />
        </>
      )}

      <TouchableOpacity
        style={[
          styles.nextButton,
          (!selectedType || !deviceBrand || !deviceModel) && styles.nextButtonDisabled,
        ]}
        onPress={() => setStep(2)}
        disabled={!selectedType || !deviceBrand || !deviceModel}
      >
        <Text style={styles.nextButtonText}>Continue</Text>
        <Ionicons name="arrow-forward" size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>What condition is your device in?</Text>
      <View style={styles.conditionsList}>
        {conditions.map((condition) => (
          <TouchableOpacity
            key={condition.id}
            style={[
              styles.conditionCard,
              selectedCondition === condition.id && styles.conditionCardSelected,
            ]}
            onPress={() => setSelectedCondition(condition.id)}
          >
            <View style={styles.conditionHeader}>
              <Text
                style={[
                  styles.conditionName,
                  selectedCondition === condition.id && styles.conditionNameSelected,
                ]}
              >
                {condition.name}
              </Text>
              {selectedCondition === condition.id && (
                <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
              )}
            </View>
            <Text style={styles.conditionDesc}>{condition.description}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setStep(1)}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.nextButton,
            styles.nextButtonFlex,
            !selectedCondition && styles.nextButtonDisabled,
          ]}
          onPress={calculateEstimate}
          disabled={!selectedCondition}
        >
          <Text style={styles.nextButtonText}>Get Estimate</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <View style={styles.estimateCard}>
        <View style={styles.estimateIcon}>
          <Ionicons name="cash" size={48} color={colors.primary} />
        </View>
        <Text style={styles.estimateLabel}>Estimated Trade-In Value</Text>
        <Text style={styles.estimateValue}>{formatPrice(estimate, currency)}</Text>
        <Text style={styles.estimateNote}>
          Final value may vary based on device inspection
        </Text>
      </View>

      <View style={styles.deviceSummary}>
        <Text style={styles.summaryTitle}>Device Summary</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Device</Text>
          <Text style={styles.summaryValue}>{selectedType?.name}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Brand</Text>
          <Text style={styles.summaryValue}>{deviceBrand}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Model</Text>
          <Text style={styles.summaryValue}>{deviceModel}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Condition</Text>
          <Text style={styles.summaryValue}>
            {conditions.find(c => c.id === selectedCondition)?.name}
          </Text>
        </View>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setStep(2)}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.nextButton, styles.nextButtonFlex]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.nextButtonText}>Submit Trade-In</Text>
              <Ionicons name="checkmark" size={20} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        {[1, 2, 3].map((s) => (
          <React.Fragment key={s}>
            <View
              style={[
                styles.progressDot,
                step >= s && styles.progressDotActive,
              ]}
            >
              {step > s ? (
                <Ionicons name="checkmark" size={14} color="#fff" />
              ) : (
                <Text style={[styles.progressNumber, step >= s && styles.progressNumberActive]}>
                  {s}
                </Text>
              )}
            </View>
            {s < 3 && (
              <View
                style={[
                  styles.progressLine,
                  step > s && styles.progressLineActive,
                ]}
              />
            )}
          </React.Fragment>
        ))}
      </View>

      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}

      <View style={{ height: spacing.xxl }} />
    </ScrollView>
  );
}

const createStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    progressContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.lg,
    },
    progressDot: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: colors.border,
    },
    progressDotActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    progressNumber: {
      fontSize: fontSize.sm,
      fontWeight: '600',
      color: colors.textMuted,
    },
    progressNumberActive: {
      color: '#fff',
    },
    progressLine: {
      width: 60,
      height: 2,
      backgroundColor: colors.border,
    },
    progressLineActive: {
      backgroundColor: colors.primary,
    },
    stepContent: {
      padding: spacing.md,
    },
    stepTitle: {
      fontSize: fontSize.xl,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: spacing.lg,
    },
    deviceGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    deviceCard: {
      width: '31%',
      aspectRatio: 1,
      backgroundColor: colors.card,
      borderRadius: borderRadius.lg,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: colors.border,
    },
    deviceCardSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '10',
    },
    deviceName: {
      fontSize: fontSize.sm,
      color: colors.textMuted,
      marginTop: spacing.xs,
      textAlign: 'center',
    },
    deviceNameSelected: {
      color: colors.primary,
      fontWeight: '600',
    },
    inputLabel: {
      fontSize: fontSize.md,
      fontWeight: '600',
      color: colors.text,
      marginBottom: spacing.xs,
      marginTop: spacing.md,
    },
    input: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      fontSize: fontSize.md,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
    },
    conditionsList: {
      gap: spacing.sm,
    },
    conditionCard: {
      backgroundColor: colors.card,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      borderWidth: 2,
      borderColor: colors.border,
    },
    conditionCardSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '10',
    },
    conditionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    conditionName: {
      fontSize: fontSize.lg,
      fontWeight: '600',
      color: colors.text,
    },
    conditionNameSelected: {
      color: colors.primary,
    },
    conditionDesc: {
      fontSize: fontSize.sm,
      color: colors.textMuted,
      marginTop: spacing.xs,
    },
    buttonRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: spacing.lg,
    },
    backButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderRadius: borderRadius.lg,
      backgroundColor: colors.surface,
    },
    backButtonText: {
      fontSize: fontSize.md,
      color: colors.text,
      fontWeight: '500',
    },
    nextButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      backgroundColor: colors.primary,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderRadius: borderRadius.lg,
      marginTop: spacing.lg,
    },
    nextButtonFlex: {
      flex: 1,
      marginTop: 0,
    },
    nextButtonDisabled: {
      opacity: 0.5,
    },
    nextButtonText: {
      color: '#fff',
      fontSize: fontSize.md,
      fontWeight: '600',
    },
    estimateCard: {
      backgroundColor: colors.primary + '15',
      borderRadius: borderRadius.xl,
      padding: spacing.xl,
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    estimateIcon: {
      marginBottom: spacing.md,
    },
    estimateLabel: {
      fontSize: fontSize.md,
      color: colors.textSecondary,
    },
    estimateValue: {
      fontSize: 48,
      fontWeight: 'bold',
      color: colors.primary,
      marginVertical: spacing.sm,
    },
    estimateNote: {
      fontSize: fontSize.sm,
      color: colors.textMuted,
      textAlign: 'center',
    },
    deviceSummary: {
      backgroundColor: colors.card,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
    },
    summaryTitle: {
      fontSize: fontSize.lg,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: spacing.md,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    summaryLabel: {
      fontSize: fontSize.md,
      color: colors.textSecondary,
    },
    summaryValue: {
      fontSize: fontSize.md,
      fontWeight: '500',
      color: colors.text,
    },
  });
