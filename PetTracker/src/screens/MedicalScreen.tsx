import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  Vaccine,
  Treatment,
  VetVisit,
  HealthRecommendation,
  Pet,
} from "../types";
import {
  loadPets,
  saveMedicalData,
  loadMedicalData,
} from "../services/storage";

interface MedicalData {
  vaccines: Vaccine[];
  treatments: Treatment[];
  vetVisits: VetVisit[];
}

export default function MedicalScreen() {
  const [activeTab, setActiveTab] = useState<
    "vaccines" | "treatments" | "visits" | "recommendations"
  >("vaccines");
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [medicalData, setMedicalData] = useState<MedicalData>({
    vaccines: [],
    treatments: [],
    vetVisits: [],
  });

  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<"vaccine" | "treatment" | "visit">(
    "vaccine"
  );

  // Form states for Vaccine
  const [vaccineName, setVaccineName] = useState("");
  const [vaccineDate, setVaccineDate] = useState(new Date());
  const [nextDueDate, setNextDueDate] = useState<Date | undefined>(undefined);
  const [veterinarian, setVeterinarian] = useState("");
  const [clinic, setClinic] = useState("");
  const [batchNumber, setBatchNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showNextDuePicker, setShowNextDuePicker] = useState(false);

  // Form states for Treatment
  const [treatmentName, setTreatmentName] = useState("");
  const [treatmentType, setTreatmentType] = useState<
    "medication" | "supplement" | "therapy" | "other"
  >("medication");
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [frequency, setFrequency] = useState("");
  const [dosage, setDosage] = useState("");
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  // Form states for Vet Visit
  const [visitDate, setVisitDate] = useState(new Date());
  const [reason, setReason] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [treatment, setTreatment] = useState("");
  const [cost, setCost] = useState("");
  const [nextVisitDate, setNextVisitDate] = useState<Date | undefined>(
    undefined
  );
  const [showVisitPicker, setShowVisitPicker] = useState(false);
  const [showNextVisitPicker, setShowNextVisitPicker] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const loadedPets = await loadPets();
      setPets(loadedPets);
      if (loadedPets.length > 0 && !selectedPet) {
        setSelectedPet(loadedPets[0]);
      }

      const data = await loadMedicalData();
      setMedicalData(data);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const saveData = async (data: MedicalData) => {
    try {
      await saveMedicalData(data);
      setMedicalData(data);
    } catch (error) {
      console.error("Error saving data:", error);
      Alert.alert("Eroare", "Nu s-au putut salva datele.");
    }
  };

  const resetForm = () => {
    setVaccineName("");
    setVaccineDate(new Date());
    setNextDueDate(undefined);
    setTreatmentName("");
    setStartDate(new Date());
    setEndDate(undefined);
    setFrequency("");
    setDosage("");
    setVisitDate(new Date());
    setReason("");
    setDiagnosis("");
    setTreatment("");
    setCost("");
    setNextVisitDate(undefined);
    setVeterinarian("");
    setClinic("");
    setBatchNumber("");
    setNotes("");
  };

  const openModal = (type: "vaccine" | "treatment" | "visit") => {
    resetForm();
    setModalType(type);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!selectedPet) {
      Alert.alert("Eroare", "Vă rugăm selectați un animal.");
      return;
    }

    let newData = { ...medicalData };

    if (modalType === "vaccine") {
      if (!vaccineName) {
        Alert.alert("Eroare", "Vă rugăm introduceți numele vaccinului.");
        return;
      }

      const newVaccine: Vaccine = {
        id: Date.now().toString(),
        petId: selectedPet.id,
        name: vaccineName,
        administeredDate: vaccineDate,
        nextDueDate: nextDueDate,
        veterinarian: veterinarian || undefined,
        clinic: clinic || undefined,
        batchNumber: batchNumber || undefined,
        notes: notes || undefined,
        completed: !nextDueDate,
      };

      newData.vaccines = [...medicalData.vaccines, newVaccine];
    } else if (modalType === "treatment") {
      if (!treatmentName) {
        Alert.alert("Eroare", "Vă rugăm introduceți numele tratamentului.");
        return;
      }

      const newTreatment: Treatment = {
        id: Date.now().toString(),
        petId: selectedPet.id,
        name: treatmentName,
        type: treatmentType,
        startDate: startDate,
        endDate: endDate,
        frequency: frequency || undefined,
        dosage: dosage || undefined,
        prescribedBy: veterinarian || undefined,
        notes: notes || undefined,
        completed: endDate ? endDate < new Date() : false,
        remindersEnabled: false,
      };

      newData.treatments = [...medicalData.treatments, newTreatment];
    } else if (modalType === "visit") {
      if (!reason) {
        Alert.alert("Eroare", "Vă rugăm introduceți motivul vizitei.");
        return;
      }

      const newVisit: VetVisit = {
        id: Date.now().toString(),
        petId: selectedPet.id,
        date: visitDate,
        reason: reason,
        diagnosis: diagnosis || undefined,
        treatment: treatment || undefined,
        veterinarian: veterinarian || undefined,
        clinic: clinic || undefined,
        cost: cost ? parseFloat(cost) : undefined,
        nextVisitDate: nextVisitDate,
        notes: notes || undefined,
      };

      newData.vetVisits = [...medicalData.vetVisits, newVisit];
    }

    await saveData(newData);
    setModalVisible(false);
    resetForm();
  };

  const handleDelete = async (
    id: string,
    type: "vaccine" | "treatment" | "visit"
  ) => {
    Alert.alert("Confirmare", "Sigur doriți să ștergeți acest element?", [
      { text: "Anulare", style: "cancel" },
      {
        text: "Șterge",
        style: "destructive",
        onPress: async () => {
          let newData = { ...medicalData };
          if (type === "vaccine") {
            newData.vaccines = medicalData.vaccines.filter((v) => v.id !== id);
          } else if (type === "treatment") {
            newData.treatments = medicalData.treatments.filter(
              (t) => t.id !== id
            );
          } else if (type === "visit") {
            newData.vetVisits = medicalData.vetVisits.filter(
              (v) => v.id !== id
            );
          }
          await saveData(newData);
        },
      },
    ]);
  };

  const getFilteredData = () => {
    if (!selectedPet) return [];

    if (activeTab === "vaccines") {
      return medicalData.vaccines.filter((v) => v.petId === selectedPet.id);
    } else if (activeTab === "treatments") {
      return medicalData.treatments.filter((t) => t.petId === selectedPet.id);
    } else if (activeTab === "visits") {
      return medicalData.vetVisits.filter((v) => v.petId === selectedPet.id);
    }
    return [];
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return `${d.getDate().toString().padStart(2, "0")}.${(d.getMonth() + 1)
      .toString()
      .padStart(2, "0")}.${d.getFullYear()}`;
  };

  const healthRecommendations: HealthRecommendation[] = [
    {
      id: "1",
      title: "Vaccinare antirabică anuală",
      description:
        "Vaccinul antirabic trebuie administrat anual pentru a proteja animalul de rabie, o boală mortală.",
      category: "vaccination",
      petType: "all",
      frequency: "Anual",
      priority: "high",
    },
    {
      id: "2",
      title: "Deparazitare externă",
      description:
        "Aplicați tratament împotriva puricilor și căpușelor lunar, mai ales în sezonul cald.",
      category: "deworming",
      petType: "all",
      frequency: "Lunar",
      priority: "high",
    },
    {
      id: "3",
      title: "Deparazitare internă",
      description:
        "Administrați antiparazitare interne la fiecare 3 luni pentru prevenirea viermilor intestinali.",
      category: "deworming",
      petType: "all",
      frequency: "La 3 luni",
      priority: "medium",
    },
    {
      id: "4",
      title: "Control dentar",
      description:
        "Verificați dinții animalului regulat și periați-i săptămânal pentru a preveni problemele dentare.",
      category: "dental",
      petType: "all",
      frequency: "Săptămânal",
      priority: "medium",
    },
    {
      id: "5",
      title: "Control veterinar anual",
      description:
        "Programați un control medical complet anual pentru depistarea precoce a problemelor de sănătate.",
      category: "general",
      petType: "all",
      frequency: "Anual",
      priority: "high",
    },
    {
      id: "6",
      title: "Vaccinare DHPP (câini)",
      description:
        "Vaccinul DHPP protejează câinii de maidanezi, hepatită, parvovirusă și parainfluenză. Necesită rapel anual.",
      category: "vaccination",
      petType: "dog",
      frequency: "Anual",
      priority: "high",
    },
    {
      id: "7",
      title: "Vaccinare panleukopenie (pisici)",
      description:
        "Vaccinul împotriva panleukopeniei, calicivirusului și herpes-virusului este esențial pentru pisici.",
      category: "vaccination",
      petType: "cat",
      frequency: "Anual",
      priority: "high",
    },
    {
      id: "8",
      title: "Îngrijirea blănii",
      description:
        "Periați blana zilnic pentru pisici cu păr lung și săptămânal pentru cele cu păr scurt.",
      category: "grooming",
      petType: "cat",
      frequency: "Zilnic/Săptămânal",
      priority: "low",
    },
  ];

  const renderRecommendations = () => {
    const filteredRecommendations = healthRecommendations.filter(
      (rec) =>
        !selectedPet ||
        rec.petType === "all" ||
        rec.petType === selectedPet.type
    );

    return (
      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Recomandări de sănătate</Text>
        {filteredRecommendations.map((rec) => (
          <View
            key={rec.id}
            style={[
              styles.card,
              rec.priority === "high" && styles.cardHighPriority,
            ]}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{rec.title}</Text>
              <View
                style={[
                  styles.priorityBadge,
                  rec.priority === "high" && styles.priorityHigh,
                  rec.priority === "medium" && styles.priorityMedium,
                  rec.priority === "low" && styles.priorityLow,
                ]}
              >
                <Text style={styles.priorityText}>
                  {rec.priority === "high"
                    ? "Prioritate mare"
                    : rec.priority === "medium"
                    ? "Medie"
                    : "Scăzută"}
                </Text>
              </View>
            </View>
            <Text style={styles.cardDescription}>{rec.description}</Text>
            <Text style={styles.cardFrequency}>Frecvență: {rec.frequency}</Text>
          </View>
        ))}
      </ScrollView>
    );
  };

  const renderVaccines = () => {
    const vaccines = getFilteredData() as Vaccine[];

    return (
      <ScrollView style={styles.content}>
        {vaccines.length === 0 ? (
          <Text style={styles.emptyText}>
            Nu există vaccinuri înregistrate.
          </Text>
        ) : (
          vaccines.map((vaccine) => (
            <View key={vaccine.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{vaccine.name}</Text>
                <TouchableOpacity
                  onPress={() => handleDelete(vaccine.id, "vaccine")}
                >
                  <Text style={styles.deleteButton}>✕</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.cardDate}>
                Administrat: {formatDate(vaccine.administeredDate)}
              </Text>
              {vaccine.nextDueDate && (
                <Text style={styles.cardDate}>
                  Următoarea doză: {formatDate(vaccine.nextDueDate)}
                </Text>
              )}
              {vaccine.veterinarian && (
                <Text style={styles.cardInfo}>
                  Veterinar: {vaccine.veterinarian}
                </Text>
              )}
              {vaccine.clinic && (
                <Text style={styles.cardInfo}>Clinică: {vaccine.clinic}</Text>
              )}
              {vaccine.notes && (
                <Text style={styles.cardNotes}>{vaccine.notes}</Text>
              )}
            </View>
          ))
        )}
      </ScrollView>
    );
  };

  const renderTreatments = () => {
    const treatments = getFilteredData() as Treatment[];

    return (
      <ScrollView style={styles.content}>
        {treatments.length === 0 ? (
          <Text style={styles.emptyText}>
            Nu există tratamente înregistrate.
          </Text>
        ) : (
          treatments.map((treatment) => (
            <View key={treatment.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{treatment.name}</Text>
                <TouchableOpacity
                  onPress={() => handleDelete(treatment.id, "treatment")}
                >
                  <Text style={styles.deleteButton}>✕</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.cardInfo}>
                Tip:{" "}
                {treatment.type === "medication"
                  ? "Medicament"
                  : treatment.type === "supplement"
                  ? "Supliment"
                  : treatment.type === "therapy"
                  ? "Terapie"
                  : "Altele"}
              </Text>
              <Text style={styles.cardDate}>
                Început: {formatDate(treatment.startDate)}
              </Text>
              {treatment.endDate && (
                <Text style={styles.cardDate}>
                  Sfârșit: {formatDate(treatment.endDate)}
                </Text>
              )}
              {treatment.frequency && (
                <Text style={styles.cardInfo}>
                  Frecvență: {treatment.frequency}
                </Text>
              )}
              {treatment.dosage && (
                <Text style={styles.cardInfo}>Dozaj: {treatment.dosage}</Text>
              )}
              {treatment.prescribedBy && (
                <Text style={styles.cardInfo}>
                  Prescris de: {treatment.prescribedBy}
                </Text>
              )}
              {treatment.notes && (
                <Text style={styles.cardNotes}>{treatment.notes}</Text>
              )}
            </View>
          ))
        )}
      </ScrollView>
    );
  };

  const renderVetVisits = () => {
    const visits = getFilteredData() as VetVisit[];

    return (
      <ScrollView style={styles.content}>
        {visits.length === 0 ? (
          <Text style={styles.emptyText}>Nu există vizite înregistrate.</Text>
        ) : (
          visits.map((visit) => (
            <View key={visit.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{visit.reason}</Text>
                <TouchableOpacity
                  onPress={() => handleDelete(visit.id, "visit")}
                >
                  <Text style={styles.deleteButton}>✕</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.cardDate}>
                Data: {formatDate(visit.date)}
              </Text>
              {visit.diagnosis && (
                <Text style={styles.cardInfo}>
                  Diagnostic: {visit.diagnosis}
                </Text>
              )}
              {visit.treatment && (
                <Text style={styles.cardInfo}>
                  Tratament: {visit.treatment}
                </Text>
              )}
              {visit.veterinarian && (
                <Text style={styles.cardInfo}>
                  Veterinar: {visit.veterinarian}
                </Text>
              )}
              {visit.clinic && (
                <Text style={styles.cardInfo}>Clinică: {visit.clinic}</Text>
              )}
              {visit.cost && (
                <Text style={styles.cardInfo}>Cost: {visit.cost} RON</Text>
              )}
              {visit.nextVisitDate && (
                <Text style={styles.cardDate}>
                  Următoarea vizită: {formatDate(visit.nextVisitDate)}
                </Text>
              )}
              {visit.notes && (
                <Text style={styles.cardNotes}>{visit.notes}</Text>
              )}
            </View>
          ))
        )}
      </ScrollView>
    );
  };

  const renderModalContent = () => {
    if (modalType === "vaccine") {
      return (
        <>
          <Text style={styles.modalTitle}>Adaugă vaccin</Text>
          <TextInput
            style={styles.input}
            placeholder="Numele vaccinului *"
            value={vaccineName}
            onChangeText={setVaccineName}
          />

          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text>Data administrării: {formatDate(vaccineDate)}</Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={vaccineDate}
              mode="date"
              display="default"
              onChange={(event, date) => {
                setShowDatePicker(Platform.OS === "ios");
                if (date) setVaccineDate(date);
              }}
            />
          )}

          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowNextDuePicker(true)}
          >
            <Text>
              {nextDueDate
                ? `Următoarea doză: ${formatDate(nextDueDate)}`
                : "Setează următoarea doză (opțional)"}
            </Text>
          </TouchableOpacity>

          {showNextDuePicker && (
            <DateTimePicker
              value={nextDueDate || new Date()}
              mode="date"
              display="default"
              onChange={(event, date) => {
                setShowNextDuePicker(Platform.OS === "ios");
                if (date) setNextDueDate(date);
              }}
            />
          )}

          <TextInput
            style={styles.input}
            placeholder="Veterinar"
            value={veterinarian}
            onChangeText={setVeterinarian}
          />

          <TextInput
            style={styles.input}
            placeholder="Clinică"
            value={clinic}
            onChangeText={setClinic}
          />

          <TextInput
            style={styles.input}
            placeholder="Număr lot"
            value={batchNumber}
            onChangeText={setBatchNumber}
          />

          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Notițe"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />
        </>
      );
    } else if (modalType === "treatment") {
      return (
        <>
          <Text style={styles.modalTitle}>Adaugă tratament</Text>
          <TextInput
            style={styles.input}
            placeholder="Numele tratamentului *"
            value={treatmentName}
            onChangeText={setTreatmentName}
          />

          <View style={styles.typeSelector}>
            {(["medication", "supplement", "therapy", "other"] as const).map(
              (type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeButton,
                    treatmentType === type && styles.typeButtonActive,
                  ]}
                  onPress={() => setTreatmentType(type)}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      treatmentType === type && styles.typeButtonTextActive,
                    ]}
                  >
                    {type === "medication"
                      ? "Medicament"
                      : type === "supplement"
                      ? "Supliment"
                      : type === "therapy"
                      ? "Terapie"
                      : "Altele"}
                  </Text>
                </TouchableOpacity>
              )
            )}
          </View>

          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowStartPicker(true)}
          >
            <Text>Data început: {formatDate(startDate)}</Text>
          </TouchableOpacity>

          {showStartPicker && (
            <DateTimePicker
              value={startDate}
              mode="date"
              display="default"
              onChange={(event, date) => {
                setShowStartPicker(Platform.OS === "ios");
                if (date) setStartDate(date);
              }}
            />
          )}

          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowEndPicker(true)}
          >
            <Text>
              {endDate
                ? `Data sfârșit: ${formatDate(endDate)}`
                : "Setează data sfârșit (opțional)"}
            </Text>
          </TouchableOpacity>

          {showEndPicker && (
            <DateTimePicker
              value={endDate || new Date()}
              mode="date"
              display="default"
              onChange={(event, date) => {
                setShowEndPicker(Platform.OS === "ios");
                if (date) setEndDate(date);
              }}
            />
          )}

          <TextInput
            style={styles.input}
            placeholder="Frecvență (ex: 2x pe zi)"
            value={frequency}
            onChangeText={setFrequency}
          />

          <TextInput
            style={styles.input}
            placeholder="Dozaj (ex: 5mg)"
            value={dosage}
            onChangeText={setDosage}
          />

          <TextInput
            style={styles.input}
            placeholder="Prescris de (veterinar)"
            value={veterinarian}
            onChangeText={setVeterinarian}
          />

          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Notițe"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />
        </>
      );
    } else if (modalType === "visit") {
      return (
        <>
          <Text style={styles.modalTitle}>Adaugă vizită veterinar</Text>

          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowVisitPicker(true)}
          >
            <Text>Data vizitei: {formatDate(visitDate)}</Text>
          </TouchableOpacity>

          {showVisitPicker && (
            <DateTimePicker
              value={visitDate}
              mode="date"
              display="default"
              onChange={(event, date) => {
                setShowVisitPicker(Platform.OS === "ios");
                if (date) setVisitDate(date);
              }}
            />
          )}

          <TextInput
            style={styles.input}
            placeholder="Motivul vizitei *"
            value={reason}
            onChangeText={setReason}
          />

          <TextInput
            style={styles.input}
            placeholder="Diagnostic"
            value={diagnosis}
            onChangeText={setDiagnosis}
          />

          <TextInput
            style={styles.input}
            placeholder="Tratament prescris"
            value={treatment}
            onChangeText={setTreatment}
          />

          <TextInput
            style={styles.input}
            placeholder="Veterinar"
            value={veterinarian}
            onChangeText={setVeterinarian}
          />

          <TextInput
            style={styles.input}
            placeholder="Clinică"
            value={clinic}
            onChangeText={setClinic}
          />

          <TextInput
            style={styles.input}
            placeholder="Cost (RON)"
            value={cost}
            onChangeText={setCost}
            keyboardType="numeric"
          />

          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowNextVisitPicker(true)}
          >
            <Text>
              {nextVisitDate
                ? `Următoarea vizită: ${formatDate(nextVisitDate)}`
                : "Setează următoarea vizită (opțional)"}
            </Text>
          </TouchableOpacity>

          {showNextVisitPicker && (
            <DateTimePicker
              value={nextVisitDate || new Date()}
              mode="date"
              display="default"
              onChange={(event, date) => {
                setShowNextVisitPicker(Platform.OS === "ios");
                if (date) setNextVisitDate(date);
              }}
            />
          )}

          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Notițe"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />
        </>
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* Pet Selector */}
      <ScrollView
        horizontal
        style={styles.petSelector}
        showsHorizontalScrollIndicator={false}
      >
        {pets.map((pet) => (
          <TouchableOpacity
            key={pet.id}
            style={[
              styles.petButton,
              selectedPet?.id === pet.id && styles.petButtonActive,
            ]}
            onPress={() => setSelectedPet(pet)}
          >
            <Text
              style={[
                styles.petButtonText,
                selectedPet?.id === pet.id && styles.petButtonTextActive,
              ]}
            >
              {pet.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "vaccines" && styles.tabActive]}
          onPress={() => setActiveTab("vaccines")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "vaccines" && styles.tabTextActive,
            ]}
          >
            Vaccinuri
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "treatments" && styles.tabActive]}
          onPress={() => setActiveTab("treatments")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "treatments" && styles.tabTextActive,
            ]}
          >
            Tratamente
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "visits" && styles.tabActive]}
          onPress={() => setActiveTab("visits")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "visits" && styles.tabTextActive,
            ]}
          >
            Vizite
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "recommendations" && styles.tabActive,
          ]}
          onPress={() => setActiveTab("recommendations")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "recommendations" && styles.tabTextActive,
            ]}
          >
            Recomandări
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === "vaccines" && renderVaccines()}
      {activeTab === "treatments" && renderTreatments()}
      {activeTab === "visits" && renderVetVisits()}
      {activeTab === "recommendations" && renderRecommendations()}

      {/* Add Button */}
      {activeTab !== "recommendations" && selectedPet && (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() =>
            openModal(
              activeTab === "vaccines"
                ? "vaccine"
                : activeTab === "treatments"
                ? "treatment"
                : "visit"
            )
          }
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      )}

      {/* Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              {renderModalContent()}

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.buttonText}>Anulează</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.saveButton]}
                  onPress={handleSave}
                >
                  <Text style={styles.buttonText}>Salvează</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  petSelector: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  petButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    marginRight: 10,
  },
  petButtonActive: {
    backgroundColor: "#4CAF50",
  },
  petButtonText: {
    fontSize: 14,
    color: "#666",
  },
  petButtonTextActive: {
    color: "#fff",
    fontWeight: "bold",
  },
  tabs: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: "center",
  },
  tabActive: {
    borderBottomWidth: 3,
    borderBottomColor: "#4CAF50",
  },
  tabText: {
    fontSize: 13,
    color: "#666",
  },
  tabTextActive: {
    color: "#4CAF50",
    fontWeight: "bold",
  },
  content: {
    flex: 1,
    padding: 15,
  },
  emptyText: {
    textAlign: "center",
    color: "#999",
    marginTop: 40,
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
  },
  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHighPriority: {
    borderLeftWidth: 4,
    borderLeftColor: "#f44336",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  cardDate: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  cardInfo: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
    lineHeight: 20,
  },
  cardFrequency: {
    fontSize: 13,
    color: "#4CAF50",
    fontWeight: "bold",
  },
  cardNotes: {
    fontSize: 13,
    color: "#888",
    fontStyle: "italic",
    marginTop: 8,
  },
  deleteButton: {
    fontSize: 20,
    color: "#f44336",
    fontWeight: "bold",
    padding: 5,
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 10,
  },
  priorityHigh: {
    backgroundColor: "#ffebee",
  },
  priorityMedium: {
    backgroundColor: "#fff3e0",
  },
  priorityLow: {
    backgroundColor: "#e8f5e9",
  },
  priorityText: {
    fontSize: 11,
    fontWeight: "bold",
  },
  addButton: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#4CAF50",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  addButtonText: {
    fontSize: 32,
    color: "#fff",
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    maxHeight: "80%",
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 14,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  dateButton: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  typeSelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 15,
    gap: 8,
  },
  typeButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
  },
  typeButtonActive: {
    backgroundColor: "#4CAF50",
    borderColor: "#4CAF50",
  },
  typeButtonText: {
    fontSize: 13,
    color: "#666",
  },
  typeButtonTextActive: {
    color: "#fff",
    fontWeight: "bold",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: "#999",
  },
  saveButton: {
    backgroundColor: "#4CAF50",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
