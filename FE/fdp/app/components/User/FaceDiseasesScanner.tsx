import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Alert, Modal, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { auth } from '../../firebase/firebase';
import MarkdownDisplay from 'react-native-markdown-display';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../../config/colors';
import { Snackbar } from 'react-native-paper';

type DiseaseName = "Eczema" | "Rosacea" | "Basal Cell Carcinoma" | "Actinic Keratosis" | "Acne";
const diseaseInfo: Record<DiseaseName, { markdown: string }> = {
    "Eczema": { "markdown": "## Eczema (Atopic Dermatitis)\n\n**Description:**\nEczema, or atopic dermatitis, is a chronic, non-contagious inflammatory skin condition characterized by dry, itchy, and inflamed skin. It often begins in childhood and may persist into adulthood.\n\n**Causes:**\n- Genetic mutations affecting skin barrier function\n- Immune system overreaction\n- Environmental irritants and allergens\n- Bacterial or viral infections\n- Food sensitivities (in infants/children)\n\n**Risk Factors:**\n- Family history of eczema, asthma, or hay fever\n- Living in urban or polluted areas\n- Dry skin or frequent exposure to water or chemicals\n\n**Symptoms:**\n- Dry, sensitive skin\n- Red or brown patches\n- Severe itching (often worse at night)\n- Oozing, crusting, or bleeding from scratching\n- Thickened, leathery skin in chronic cases\n\n**Diagnosis:**\n- Physical exam\n- Patient history\n- Patch testing (if allergic contact suspected)\n- Skin biopsy (rarely needed)\n\n**Treatment:**\n- Emollients (thick moisturizers) multiple times a day\n- Topical corticosteroids or calcineurin inhibitors\n- Oral antihistamines to reduce itching\n- Immunosuppressants for severe cases (e.g., cyclosporine)\n- Dupilumab (monoclonal antibody for moderate-to-severe eczema)\n\n**Complications:**\n- Skin infections (e.g., staph or herpes simplex)\n- Sleep disturbances\n- Lichenification (thickened skin from scratching)\n- Psychosocial impact (depression, anxiety)\n\n**Prevention:**\n- Keep skin moisturized\n- Avoid irritants and allergens\n- Use mild, fragrance-free soaps\n- Wear cotton clothing\n- Keep fingernails short to avoid scratching damage\n\n**When to See a Doctor:**\n- Symptoms interfere with sleep or daily life\n- Signs of infection (pus, crusting, fever)\n- Worsening symptoms despite treatment" },
    "Rosacea": { "markdown": "## Rosacea\n\n**Description:**\nRosacea is a chronic skin condition that causes facial redness, visible blood vessels, and acne-like bumps. It mainly affects middle-aged women with fair skin but can occur in anyone.\n\n**Causes:**\n- Unknown; believed to involve immune system, neurovascular dysregulation, and skin mites (Demodex folliculorum)\n- Triggers such as sunlight, hot beverages, spicy food, and alcohol\n\n**Risk Factors:**\n- Fair skin\n- Age 30–60\n- Family history\n- Female gender\n- Frequent blushing or flushing\n\n**Symptoms:**\n- Persistent facial redness (central face)\n- Telangiectasia (visible blood vessels)\n- Bumps or pimples\n- Thickened skin (especially on nose — rhinophyma)\n- Eye irritation (dryness, tearing, swollen eyelids)\n\n**Diagnosis:**\n- Clinical exam\n- Medical history\n- Rule out acne, lupus, or allergic dermatitis\n\n**Treatment:**\n- Topical antibiotics (metronidazole, ivermectin)\n- Oral antibiotics (doxycycline)\n- Azelaic acid and brimonidine gel\n- Laser therapy for visible blood vessels\n- Eye drops for ocular symptoms\n\n**Complications:**\n- Rhinophyma (enlarged nose tissue in men)\n- Eye damage if untreated\n- Social or emotional distress\n\n**Prevention:**\n- Identify and avoid personal triggers\n- Use sunscreen (SPF 30+) daily\n- Use gentle, non-irritating skin products\n- Avoid extreme temperatures\n\n**When to See a Doctor:**\n- Persistent redness or eye symptoms\n- Skin thickening or visible veins\n- Emotional impact from appearance" },
    "Basal Cell Carcinoma": { "markdown": "## Basal Cell Carcinoma (BCC)\n\n**Description:**\nBCC is the most common type of skin cancer. It originates in the basal cells — small, round cells found in the lower part of the epidermis. It grows slowly and rarely spreads but can cause disfigurement if untreated.\n\n**Causes:**\n- Prolonged UV radiation exposure (sun or tanning beds)\n- Genetic predisposition (e.g., basal cell nevus syndrome)\n\n**Risk Factors:**\n- Fair skin, light eyes/hair\n- History of sunburns or intense sun exposure\n- Age > 50\n- Immunosuppression\n- Exposure to arsenic or radiation\n\n**Symptoms:**\n- Pearly or waxy bump (often with visible blood vessels)\n- Flat, flesh-colored or brown scar-like lesion\n- Bleeding or non-healing sore\n- Lesions on sun-exposed areas (head, neck, ears)\n\n**Diagnosis:**\n- Skin biopsy (punch or shave)\n- Dermoscopy examination\n\n**Treatment:**\n- Excision or curettage with electrodessication\n- Mohs surgery for high-risk areas (face)\n- Cryotherapy (freezing)\n- Topical therapies (imiquimod or fluorouracil)\n- Radiation therapy (if surgery not possible)\n\n**Complications:**\n- Tissue destruction if untreated\n- Recurrence (especially on nose, ears)\n- Rare metastasis in aggressive subtypes\n\n**Prevention:**\n- Avoid sun exposure (especially 10am–4pm)\n- Use SPF 30+ sunscreen\n- Wear protective clothing and hats\n- Avoid tanning beds\n\n**When to See a Doctor:**\n- New skin growth that doesn’t heal\n- Changes in existing moles or lesions\n- Sores that bleed or scab repeatedly" },
    "Actinic Keratosis": { "markdown": "## Actinic Keratosis (AK)\n\n**Description:**\nActinic keratosis is a precancerous condition where rough, scaly patches form on the skin due to sun damage. It can progress into squamous cell carcinoma if left untreated.\n\n**Causes:**\n- Cumulative UV damage over years\n- Artificial UV sources (tanning beds)\n\n**Risk Factors:**\n- Light skin, hair, and eyes\n- Age over 40\n- Chronic sun exposure\n- Living in sunny climates\n- Immunocompromised state\n\n**Symptoms:**\n- Rough, scaly, or crusty patch\n- Red, pink, or flesh-colored lesion\n- Often on face, scalp, ears, arms, hands\n- May feel tender or itchy\n\n**Diagnosis:**\n- Physical exam\n- Dermatoscopy\n- Skin biopsy (if malignancy suspected)\n\n**Treatment:**\n- Cryotherapy (liquid nitrogen freezing)\n- Topical medications (fluorouracil, imiquimod)\n- Photodynamic therapy (light-activated treatment)\n- Curettage and electrosurgery\n- Laser therapy\n\n**Complications:**\n- Progression to squamous cell carcinoma (up to 10%)\n- Cosmetic concerns\n\n**Prevention:**\n- Avoid prolonged sun exposure\n- Daily use of broad-spectrum SPF 30+ sunscreen\n- Protective clothing and hats\n- Regular skin checks (especially if immunocompromised)\n\n**When to See a Doctor:**\n- New or changing scaly patches\n- Persistent tenderness or itching\n- Family or personal history of skin cancer" },
    "Acne": { "markdown": "## Acne Vulgaris\n\n**Description:**\nAcne is a chronic inflammatory skin condition affecting the hair follicles and sebaceous glands, leading to pimples, blackheads, and cysts. It mostly affects teenagers but can persist or begin in adulthood.\n\n**Causes:**\n- Excess sebum production\n- Clogged pores from dead skin cells\n- Bacterial infection (Cutibacterium acnes)\n- Hormonal fluctuations (e.g., puberty, menstruation)\n- Certain medications (steroids, lithium)\n\n**Risk Factors:**\n- Adolescence\n- Family history\n- Hormonal disorders (e.g., PCOS)\n- Oily skincare or hair products\n- Diet high in refined sugars and dairy\n\n**Symptoms:**\n- Whiteheads and blackheads\n- Papules and pustules\n- Nodules and cysts (deep, painful lumps)\n- Scarring and hyperpigmentation\n\n**Diagnosis:**\n- Clinical skin examination\n- Hormonal testing (in women with irregular periods or hirsutism)\n\n**Treatment:**\n- Topical retinoids, benzoyl peroxide, salicylic acid\n- Oral antibiotics (doxycycline, minocycline)\n- Hormonal therapy (oral contraceptives, spironolactone)\n- Isotretinoin for severe cystic acne\n- Chemical peels, microdermabrasion, laser therapy for scarring\n\n**Complications:**\n- Permanent scarring\n- Psychological impact (low self-esteem, depression)\n- Post-inflammatory hyperpigmentation\n\n**Prevention:**\n- Gentle face cleansing twice daily\n- Use oil-free, non-comedogenic products\n- Don’t squeeze or pick lesions\n- Healthy, low-sugar diet\n- Manage stress levels\n\n**When to See a Doctor:**\n- Acne not improving with OTC treatments\n- Severe, painful cystic acne\n- Signs of hormonal imbalance (in females)\n- Emotional distress due to appearance" }
};

const FaceDiseaseScanner = () => {
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [prediction, setPrediction] = useState<{ predicted_class: string; confidence: number } | null>(null);
    const [snackbarVisible, setSnackbarVisible] = useState<boolean>(false);
    const [snackbarMessage, setSnackbarMessage] = useState<string>('');
    const [snackbarType, setSnackbarType] = useState<'success' | 'error'>('success');
    const [loading, setLoading] = useState<boolean>(false);
    const [modalVisible, setModalVisible] = useState<boolean>(false);

    useEffect(() => {
        const requestPermissions = async () => {
            const cameraPerm = await ImagePicker.requestCameraPermissionsAsync();
            const galleryPerm = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!cameraPerm.granted || !galleryPerm.granted) {
                Alert.alert(
                    'Permissions Required',
                    'Camera and gallery access are required to use this feature.',
                    [{ text: 'OK' }]
                );
            }
        };
        requestPermissions();
    }, []);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            setImageUri(result.assets[0].uri);
            setPrediction(null);
        }
    };

    const captureImage = async () => {
        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            setImageUri(result.assets[0].uri);
            setPrediction(null);
        }
    };

    const scanImage = async () => {
        if (!imageUri) {
            showSnackbar('Please select or capture an image first.', 'error');
            return;
        }

        if (!auth.currentUser) {
            showSnackbar('User not authenticated.', 'error');
            return;
        }

        setLoading(true);
        try {
            const user_id = auth.currentUser.uid;
            const formData = new FormData();
            formData.append('file', { uri: imageUri, name: 'face.jpg', type: 'image/jpeg' } as any);
            formData.append('user_id', user_id);

            const response = await fetch('http://192.168.1.4:8000/api/predict/', {
                method: 'POST',
                body: formData,
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to scan image');
            }

            const data = await response.json();
            setPrediction({ predicted_class: data.predicted_class, confidence: data.confidence });
            showSnackbar('Scan completed successfully!', 'success');
        } catch (error: any) {
            console.error('Scan error:', error.message);
            showSnackbar(`Error scanning image: ${error.message}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    const showSnackbar = (message: string, type: 'success' | 'error') => {
        setSnackbarMessage(message);
        setSnackbarType(type);
        setSnackbarVisible(true);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Face Disease Scanner</Text>
            {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.image} />
            ) : (
                <View style={styles.placeholder}>
                    <Text style={styles.placeholderText}>No Image Selected</Text>
                </View>
            )}
            <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.button} onPress={pickImage} disabled={loading}>
                    <Text style={styles.buttonText}>Upload Image</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.button} onPress={captureImage} disabled={loading}>
                    <Text style={styles.buttonText}>Capture Photo</Text>
                </TouchableOpacity>
            </View>
            <TouchableOpacity style={[styles.scanButton, loading && styles.disabledButton]} onPress={scanImage} disabled={loading}>
                <Text style={styles.scanButtonText}>{loading ? 'Scanning...' : 'Scan Image'}</Text>
            </TouchableOpacity>
            {prediction && (
                <View style={styles.resultCard}>
                    <Text style={styles.resultText}>Predicted Condition: {prediction.predicted_class}</Text>
                    <Text style={styles.resultText}>Confidence: {(prediction.confidence * 100).toFixed(2)}%</Text>
                    {diseaseInfo[prediction.predicted_class as DiseaseName] && (
                        <TouchableOpacity style={styles.infoButton} onPress={() => setModalVisible(true)}>
                            <Text style={styles.infoButtonText}>View Disease Information</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}
            {prediction && diseaseInfo[prediction.predicted_class as DiseaseName] && (
                <Modal animationType="fade" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
                    <View style={styles.modalOverlay}>
                        <LinearGradient colors={['#E8F5E9', '#C8E6C9']} style={styles.modalContainer}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>{prediction.predicted_class}</Text>
                                <TouchableOpacity onPress={() => setModalVisible(false)}>
                                    <Icon name="close" size={24} color={colors.text} />
                                </TouchableOpacity>
                            </View>
                            <ScrollView style={styles.modalContent}>
                                <MarkdownDisplay style={markdownStyles}>
                                    {diseaseInfo[prediction.predicted_class as DiseaseName].markdown}
                                </MarkdownDisplay>
                            </ScrollView>
                        </LinearGradient>
                    </View>
                </Modal>
            )}
            <View style={styles.snackbarContainer}>
                <Snackbar
                    visible={snackbarVisible}
                    onDismiss={() => setSnackbarVisible(false)}
                    duration={Snackbar.DURATION_SHORT}
                    style={{ backgroundColor: snackbarType === 'success' ? colors.success : colors.error, borderRadius: 8, elevation: 3 }}
                >
                    <Text style={styles.snackbarText}>{snackbarMessage}</Text>
                </Snackbar>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        padding: 16,
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 16,
        textAlign: 'center',
    },
    image: {
        width: '100%',
        height: 300,
        borderRadius: 8,
        marginBottom: 16,
        resizeMode: 'contain',
    },
    placeholder: {
        width: '100%',
        height: 300,
        borderRadius: 8,
        backgroundColor: '#D1D5DB',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 16,
    },
    button: {
        backgroundColor: colors.primary,
        padding: 12,
        borderRadius: 8,
        flex: 1,
        marginHorizontal: 5,
        elevation: 2,
    },
    scanButton: {
        backgroundColor: colors.success,
        padding: 12,
        borderRadius: 8,
        alignSelf: 'center',
        marginBottom: 16,
        elevation: 2,
    },
    disabledButton: {
        backgroundColor: colors.inactiveTint,
    },
    resultCard: {
        backgroundColor: colors.cardBackground,
        padding: 16,
        borderRadius: 8,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        marginBottom: 16,
    },
    infoButton: {
        backgroundColor: '#FF9800',
        padding: 10,
        borderRadius: 8,
        marginTop: 10,
        alignItems: 'center',
        elevation: 2,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: '90%',
        maxHeight: '80%',
        borderRadius: 16,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 5,
        overflow: 'hidden',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    modalContent: {
        padding: 16,
    },
    snackbarContainer: {
        position: 'absolute',
        bottom: 10,
        left: 10,
        right: 10,
    },
    placeholderText: {
        fontSize: 16,
        color: colors.text,
    },
    buttonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    scanButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    resultText: {
        fontSize: 16,
        color: colors.text,
        marginBottom: 4,
    },
    infoButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.text,
    },
    snackbarText: {
        color: '#FFF',
    },
});

const markdownStyles = {
    body: { fontSize: 14, color: colors.text, lineHeight: 20 },
    heading1: { fontSize: 18, fontWeight: 'bold', marginTop: 10, marginBottom: 5, color: '#2E7D32' },
    heading2: { fontSize: 16, fontWeight: 'bold', marginTop: 8, marginBottom: 4, color: '#388E3C' },
    strong: { fontWeight: "bold" as "bold" },
    listItem: { marginLeft: 15, marginBottom: 5 },
};

export default FaceDiseaseScanner;