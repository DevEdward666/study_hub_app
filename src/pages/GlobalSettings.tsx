import React, { useState, useEffect } from "react";
import {
  IonButton,
  IonContent,
  IonInput,
  IonItem,
  IonLabel,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonToast,
  IonIcon,
  IonText,
  IonSegment,
  IonSegmentButton,
  IonList,
  IonTextarea,
  IonBadge,
  IonChip,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonSelect,
  IonSelectOption,
  IonToggle,
  IonSearchbar,
} from "@ionic/react";
import {
  settingsOutline,
  saveOutline,
  cashOutline,
  addOutline,
  closeOutline,
  timeOutline,
  createOutline,
  eyeOutline,
  filterOutline,
  searchOutline,
} from "ionicons/icons";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { ErrorMessage } from "../components/common/ErrorMessage";
import { ConfirmToast } from "../components/common/ConfirmToast";
import { useConfirmation } from "../hooks/useConfirmation";
import globalSettingsService, {
  GlobalSetting,
  GlobalSettingHistory,
  CreateGlobalSettingRequest,
} from "../services/global-settings.service";
import { PrinterSettings } from "../components/PrinterSettings";
import "../Admin/styles/admin.css";
import "../Admin/styles/admin-responsive.css";
import "../styles/side-modal.css";

const GlobalSettings: React.FC = () => {
  // State for settings data
  const [settings, setSettings] = useState<GlobalSetting[]>([]);
  const [filteredSettings, setFilteredSettings] = useState<GlobalSetting[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  // State for history
  const [recentChanges, setRecentChanges] = useState<GlobalSettingHistory[]>([]);
  const [selectedSettingHistory, setSelectedSettingHistory] = useState<GlobalSettingHistory[]>([]);
  
  // UI State
  const [activeTab, setActiveTab] = useState<"settings" | "history">("settings");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastColor, setToastColor] = useState<"success" | "danger" | "warning">("success");
  
  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedSetting, setSelectedSetting] = useState<GlobalSetting | null>(null);
  
  // Form states
  const [editValue, setEditValue] = useState<string>("");
  const [changeReason, setChangeReason] = useState<string>("");
  const [newSetting, setNewSetting] = useState<CreateGlobalSettingRequest>({
    key: "",
    value: "",
    description: "",
    dataType: "string",
    category: "general",
    isPublic: false,
    isEncrypted: false,
  });

  // Confirmation hook
  const {
    isOpen: isConfirmOpen,
    options: confirmOptions,
    showConfirmation,
    handleConfirm: confirmAction,
    handleCancel: cancelAction,
    handleDismiss: dismissConfirm,
  } = useConfirmation();

  // Load data on mount
  useEffect(() => {
    loadSettings();
    loadRecentChanges();
  }, []);

  // Filter settings when search or category changes
  useEffect(() => {
    filterSettings();
  }, [settings, selectedCategory, searchQuery]);

  // ============= Data Loading Functions =============

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const data = await globalSettingsService.getAllSettings();
      setSettings(data || []);
    } catch (error: any) {
      console.error("Failed to load settings:", error);
      setToastMessage(`❌ Failed to load settings: ${error.message || "Unknown error"}`);
      setToastColor("danger");
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRecentChanges = async () => {
    try {
      const data = await globalSettingsService.getRecentChanges(50);
      setRecentChanges(data || []);
    } catch (error: any) {
      console.error("Failed to load recent changes:", error);
    }
  };

  const loadSettingHistory = async (settingId: string) => {
    try {
      const data = await globalSettingsService.getSettingHistory(settingId);
      setSelectedSettingHistory(data || []);
      setShowHistoryModal(true);
    } catch (error: any) {
      console.error("Failed to load setting history:", error);
      setToastMessage(`❌ Failed to load history: ${error.message || "Unknown error"}`);
      setToastColor("danger");
      setShowToast(true);
    }
  };

  // ============= Filter Functions =============

  const filterSettings = () => {
    let filtered = settings;

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter((s) => s.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.key.toLowerCase().includes(query) ||
          s.description?.toLowerCase().includes(query) ||
          s.category.toLowerCase().includes(query)
      );
    }

    setFilteredSettings(filtered);
  };

  const getCategories = (): string[] => {
    const categories = new Set(settings.map((s) => s.category));
    return Array.from(categories).sort();
  };

  // ============= CRUD Functions =============

  const handleEditSetting = (setting: GlobalSetting) => {
    setSelectedSetting(setting);
    setEditValue(setting.value);
    setChangeReason("");
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedSetting) return;

    // Validate
    if (!editValue.trim()) {
      setToastMessage("Value cannot be empty");
      setToastColor("danger");
      setShowToast(true);
      return;
    }

    showConfirmation(
      {
        header: "Update Setting",
        message: `Are you sure you want to update "${selectedSetting.key}"?\n\nOld Value: ${selectedSetting.value}\nNew Value: ${editValue}`,
        confirmText: "Update",
        cancelText: "Cancel",
      },
      async () => {
        await saveSetting();
      }
    );
  };

  const saveSetting = async () => {
    if (!selectedSetting) return;

    setIsSaving(true);
    try {
      await globalSettingsService.updateSetting({
        id: selectedSetting.id,
        value: editValue,
        changeReason: changeReason || undefined,
      });

      setToastMessage(`✅ Setting "${selectedSetting.key}" updated successfully!`);
      setToastColor("success");
      setShowToast(true);
      setShowEditModal(false);
      
      // Reload data
      await loadSettings();
      await loadRecentChanges();
    } catch (error: any) {
      console.error("Failed to save setting:", error);
      setToastMessage(`❌ Failed to update setting: ${error.message || "Unknown error"}`);
      setToastColor("danger");
      setShowToast(true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateSetting = async () => {
    // Validate
    if (!newSetting.key.trim() || !newSetting.value.trim()) {
      setToastMessage("Key and Value are required");
      setToastColor("danger");
      setShowToast(true);
      return;
    }

    setIsSaving(true);
    try {
      await globalSettingsService.createSetting(newSetting);

      setToastMessage(`✅ Setting "${newSetting.key}" created successfully!`);
      setToastColor("success");
      setShowToast(true);
      setShowCreateModal(false);
      
      // Reset form
      setNewSetting({
        key: "",
        value: "",
        description: "",
        dataType: "string",
        category: "general",
        isPublic: false,
        isEncrypted: false,
      });
      
      // Reload data
      await loadSettings();
    } catch (error: any) {
      console.error("Failed to create setting:", error);
      setToastMessage(`❌ Failed to create setting: ${error.message || "Unknown error"}`);
      setToastColor("danger");
      setShowToast(true);
    } finally {
      setIsSaving(false);
    }
  };

  // ============= Render Helper Functions =============

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getDataTypeColor = (dataType: string): string => {
    switch (dataType) {
      case "string": return "primary";
      case "number": return "success";
      case "boolean": return "warning";
      case "json": return "secondary";
      default: return "medium";
    }
  };

  // ============= Handle form submission (legacy, kept for compatibility) =============
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    // This is now handled by the new edit modal system
  };

  // ============= Render =============

  if (isLoading) {
    return <LoadingSpinner message="Loading settings..." />;
  }

  return (
    <IonContent>
      <div className="global-settings">
        {/* Page Header */}
        <div className="page-header">
          <h1 style={{ color: 'var(--ion-color-primary)' }}>
            <IonIcon icon={settingsOutline} style={{ marginRight: '10px' }} />
            Global Settings
          </h1>
          <p>Configure system-wide settings for the study hub</p>
        </div>

        {/* Tab Selector */}
        <IonSegment
          value={activeTab}
          onIonChange={(e) => setActiveTab(e.detail.value as "settings" | "history")}
          style={{ marginBottom: '20px' }}
        >
          <IonSegmentButton value="settings">
            <IonLabel>Settings</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="history">
            <IonLabel>
              Change History
              {recentChanges.length > 0 && (
                <IonBadge color="primary" style={{ marginLeft: '8px' }}>
                  {recentChanges.length}
                </IonBadge>
              )}
            </IonLabel>
          </IonSegmentButton>
        </IonSegment>

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <>
            {/* Thermal Printer Settings */}
            <div style={{ marginBottom: '20px' }}>
              <PrinterSettings 
                onPrintTest={() => {
                  setToastMessage("✅ Test receipt printed successfully!");
                  setToastColor("success");
                  setShowToast(true);
                }}
              />
            </div>

            {/* Search and Filter Bar */}
            <IonCard>
              <IonCardContent style={{ padding: '12px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <IonSearchbar
                      value={searchQuery}
                      onIonInput={(e) => setSearchQuery(e.detail.value || "")}
                      placeholder="Search settings..."
                      animated
                      style={{ padding: 0 }}
                    />
                  </div>
                  <IonSelect
                    value={selectedCategory}
                    onIonChange={(e) => setSelectedCategory(e.detail.value)}
                    interface="popover"
                    placeholder="Filter by category"
                    style={{ minWidth: '180px' }}
                  >
                    <IonSelectOption value="all">All Categories</IonSelectOption>
                    {getCategories().map((cat) => (
                      <IonSelectOption key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </IonSelectOption>
                    ))}
                  </IonSelect>
                  <IonButton
                    onClick={() => setShowCreateModal(true)}
                    color="success"
                    size="default"
                  >
                    <IonIcon icon={addOutline} slot="start" />
                    New Setting
                  </IonButton>
                </div>
                <IonText color="medium" style={{ fontSize: '12px', marginTop: '8px', display: 'block' }}>
                  {filteredSettings.length} of {settings.length} settings
                </IonText>
              </IonCardContent>
            </IonCard>

            {/* Settings List */}
            {filteredSettings.length === 0 ? (
              <IonCard>
                <IonCardContent style={{ textAlign: 'center', padding: '40px' }}>
                  <IonIcon
                    icon={searchOutline}
                    style={{ fontSize: '64px', color: '#ccc', marginBottom: '16px' }}
                  />
                  <IonText color="medium">
                    <p>No settings found</p>
                  </IonText>
                </IonCardContent>
              </IonCard>
            ) : (
              <IonList>
                {filteredSettings.map((setting) => (
                  <IonCard key={setting.id} style={{ marginBottom: '12px' }}>
                    <IonCardContent>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <IonText style={{ fontSize: '16px', fontWeight: 'bold' }}>
                              {setting.key}
                            </IonText>
                            <IonChip color={getDataTypeColor(setting.dataType)} style={{ height: '20px' }}>
                              <IonLabel style={{ fontSize: '11px' }}>{setting.dataType}</IonLabel>
                            </IonChip>
                            <IonChip color="medium" style={{ height: '20px' }}>
                              <IonLabel style={{ fontSize: '11px' }}>{setting.category}</IonLabel>
                            </IonChip>
                            {setting.isPublic && (
                              <IonChip color="tertiary" style={{ height: '20px' }}>
                                <IonLabel style={{ fontSize: '11px' }}>Public</IonLabel>
                              </IonChip>
                            )}
                            {setting.isEncrypted && (
                              <IonChip color="danger" style={{ height: '20px' }}>
                                <IonLabel style={{ fontSize: '11px' }}>Encrypted</IonLabel>
                              </IonChip>
                            )}
                          </div>
                          {setting.description && (
                            <IonText color="medium" style={{ fontSize: '13px', display: 'block', marginBottom: '8px' }}>
                              {setting.description}
                            </IonText>
                          )}
                          <div style={{ 
                            background: '#f5f5f5', 
                            padding: '8px 12px', 
                            borderRadius: '6px',
                            marginBottom: '8px'
                          }}>
                            <IonText style={{ fontSize: '14px', fontFamily: 'monospace' }}>
                              {setting.isEncrypted ? '••••••••' : setting.value}
                            </IonText>
                          </div>
                          <IonText color="medium" style={{ fontSize: '11px' }}>
                            Last updated: {formatDate(setting.updatedAt)}
                            {setting.updatedByEmail && ` by ${setting.updatedByEmail}`}
                          </IonText>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginLeft: '16px' }}>
                          <IonButton
                            size="small"
                            fill="outline"
                            onClick={() => handleEditSetting(setting)}
                          >
                            <IonIcon icon={createOutline} slot="icon-only" />
                          </IonButton>
                          <IonButton
                            size="small"
                            fill="outline"
                            color="medium"
                            onClick={() => loadSettingHistory(setting.id)}
                          >
                            <IonIcon icon={timeOutline} slot="icon-only" />
                          </IonButton>
                        </div>
                      </div>
                    </IonCardContent>
                  </IonCard>
                ))}
              </IonList>
            )}
          </>
        )}

        {/* History Tab */}
        {activeTab === "history" && (
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>
                <IonIcon icon={timeOutline} style={{ marginRight: '8px' }} />
                Recent Changes
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              {recentChanges.length === 0 ? (
                <IonText color="medium">
                  <p style={{ textAlign: 'center', padding: '20px' }}>No recent changes</p>
                </IonText>
              ) : (
                <IonList>
                  {recentChanges.map((change) => (
                    <IonItem key={change.id} lines="full">
                      <div style={{ width: '100%', padding: '8px 0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                          <IonText style={{ fontWeight: 'bold' }}>{change.key}</IonText>
                          <IonText color="medium" style={{ fontSize: '12px' }}>
                            {formatDate(change.changedAt)}
                          </IonText>
                        </div>
                        <div style={{ fontSize: '13px', marginBottom: '4px' }}>
                          <IonText color="danger">Old: </IonText>
                          <IonText style={{ fontFamily: 'monospace' }}>
                            {change.oldValue || '(empty)'}
                          </IonText>
                        </div>
                        <div style={{ fontSize: '13px', marginBottom: '4px' }}>
                          <IonText color="success">New: </IonText>
                          <IonText style={{ fontFamily: 'monospace' }}>
                            {change.newValue}
                          </IonText>
                        </div>
                        {change.changeReason && (
                          <IonText color="medium" style={{ fontSize: '12px', fontStyle: 'italic' }}>
                            Reason: {change.changeReason}
                          </IonText>
                        )}
                        <IonText color="medium" style={{ fontSize: '11px', display: 'block', marginTop: '4px' }}>
                          Changed by: {change.changedByEmail}
                        </IonText>
                      </div>
                    </IonItem>
                  ))}
                </IonList>
              )}
            </IonCardContent>
          </IonCard>
        )}

        {/* Edit Setting Modal */}
        <IonModal 
          isOpen={showEditModal} 
          onDidDismiss={() => setShowEditModal(false)}
          breakpoints={[0, 1]}
          initialBreakpoint={1}
          handle={false}
          className="side-modal"
        >
          <IonHeader>
            <IonToolbar>
              <IonTitle>Edit Setting</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowEditModal(false)}>
                  <IonIcon icon={closeOutline} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            {selectedSetting && (
              <>
                <IonItem>
                  <IonLabel position="stacked">Key</IonLabel>
                  <IonInput value={selectedSetting.key} readonly />
                </IonItem>
                <IonItem>
                  <IonLabel position="stacked">Description</IonLabel>
                  <IonText color="medium" style={{ fontSize: '13px' }}>
                    {selectedSetting.description || 'No description'}
                  </IonText>
                </IonItem>
                <IonItem>
                  <IonLabel position="stacked">Current Value</IonLabel>
                  <IonText style={{ fontFamily: 'monospace', fontSize: '13px' }}>
                    {selectedSetting.value}
                  </IonText>
                </IonItem>
                <IonItem>
                  <IonLabel position="stacked">New Value *</IonLabel>
                  <IonInput
                    value={editValue}
                    onIonInput={(e) => setEditValue(e.detail.value || "")}
                    placeholder="Enter new value"
                  />
                </IonItem>
                <IonItem>
                  <IonLabel position="stacked">Change Reason (Optional)</IonLabel>
                  <IonTextarea
                    value={changeReason}
                    onIonInput={(e) => setChangeReason(e.detail.value || "")}
                    placeholder="Why are you making this change?"
                    rows={3}
                  />
                </IonItem>
                {selectedSetting.minValue !== null && selectedSetting.maxValue !== null && (
                  <IonItem>
                    <IonText color="medium" style={{ fontSize: '12px' }}>
                      Valid range: {selectedSetting.minValue} - {selectedSetting.maxValue}
                    </IonText>
                  </IonItem>
                )}
                {selectedSetting.allowedValues && (
                  <IonItem>
                    <IonText color="medium" style={{ fontSize: '12px' }}>
                      Allowed values: {selectedSetting.allowedValues}
                    </IonText>
                  </IonItem>
                )}
                <div style={{ marginTop: '24px' }}>
                  <IonButton
                    expand="block"
                    onClick={handleSaveEdit}
                    disabled={isSaving || !editValue.trim()}
                  >
                    <IonIcon icon={saveOutline} slot="start" />
                    {isSaving ? "Saving..." : "Save Changes"}
                  </IonButton>
                </div>
              </>
            )}
          </IonContent>
        </IonModal>

        {/* Create Setting Modal */}
        <IonModal 
          isOpen={showCreateModal} 
          onDidDismiss={() => setShowCreateModal(false)}
          breakpoints={[0, 1]}
          initialBreakpoint={1}
          handle={false}
          className="side-modal"
        >
          <IonHeader>
            <IonToolbar>
              <IonTitle>Create New Setting</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowCreateModal(false)}>
                  <IonIcon icon={closeOutline} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <IonItem>
              <IonLabel position="stacked">Key *</IonLabel>
              <IonInput
                value={newSetting.key}
                onIonInput={(e) => setNewSetting({ ...newSetting, key: e.detail.value || "" })}
                placeholder="e.g., app.feature.enabled"
              />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">Value *</IonLabel>
              <IonInput
                value={newSetting.value}
                onIonInput={(e) => setNewSetting({ ...newSetting, value: e.detail.value || "" })}
                placeholder="Enter value"
              />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">Description</IonLabel>
              <IonTextarea
                value={newSetting.description}
                onIonInput={(e) => setNewSetting({ ...newSetting, description: e.detail.value || "" })}
                placeholder="Describe this setting"
                rows={2}
              />
            </IonItem>
            <IonItem>
              <IonLabel>Data Type</IonLabel>
              <IonSelect
                value={newSetting.dataType}
                onIonChange={(e) => setNewSetting({ ...newSetting, dataType: e.detail.value })}
              >
                <IonSelectOption value="string">String</IonSelectOption>
                <IonSelectOption value="number">Number</IonSelectOption>
                <IonSelectOption value="boolean">Boolean</IonSelectOption>
                <IonSelectOption value="json">JSON</IonSelectOption>
              </IonSelect>
            </IonItem>
            <IonItem>
              <IonLabel>Category</IonLabel>
              <IonSelect
                value={newSetting.category}
                onIonChange={(e) => setNewSetting({ ...newSetting, category: e.detail.value })}
              >
                <IonSelectOption value="general">General</IonSelectOption>
                <IonSelectOption value="payment">Payment</IonSelectOption>
                <IonSelectOption value="notification">Notification</IonSelectOption>
                <IonSelectOption value="system">System</IonSelectOption>
                <IonSelectOption value="feature">Feature</IonSelectOption>
              </IonSelect>
            </IonItem>
            <IonItem>
              <IonLabel>Public (accessible without auth)</IonLabel>
              <IonToggle
                checked={newSetting.isPublic}
                onIonChange={(e) => setNewSetting({ ...newSetting, isPublic: e.detail.checked })}
              />
            </IonItem>
            <IonItem>
              <IonLabel>Encrypted</IonLabel>
              <IonToggle
                checked={newSetting.isEncrypted}
                onIonChange={(e) => setNewSetting({ ...newSetting, isEncrypted: e.detail.checked })}
              />
            </IonItem>
            <div style={{ marginTop: '24px' }}>
              <IonButton
                expand="block"
                onClick={handleCreateSetting}
                disabled={isSaving || !newSetting.key.trim() || !newSetting.value.trim()}
              >
                <IonIcon icon={addOutline} slot="start" />
                {isSaving ? "Creating..." : "Create Setting"}
              </IonButton>
            </div>
          </IonContent>
        </IonModal>

        {/* History Detail Modal */}
        <IonModal 
          isOpen={showHistoryModal} 
          onDidDismiss={() => setShowHistoryModal(false)}
          breakpoints={[0, 1]}
          initialBreakpoint={1}
          handle={false}
          className="side-modal"
        >
          <IonHeader>
            <IonToolbar>
              <IonTitle>Setting History</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowHistoryModal(false)}>
                  <IonIcon icon={closeOutline} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <IonList>
              {selectedSettingHistory.map((change) => (
                <IonCard key={change.id}>
                  <IonCardContent>
                    <IonText color="medium" style={{ fontSize: '12px' }}>
                      {formatDate(change.changedAt)}
                    </IonText>
                    <div style={{ marginTop: '8px' }}>
                      <div style={{ marginBottom: '8px' }}>
                        <IonText color="danger">Old: </IonText>
                        <IonText style={{ fontFamily: 'monospace' }}>
                          {change.oldValue || '(empty)'}
                        </IonText>
                      </div>
                      <div style={{ marginBottom: '8px' }}>
                        <IonText color="success">New: </IonText>
                        <IonText style={{ fontFamily: 'monospace' }}>
                          {change.newValue}
                        </IonText>
                      </div>
                      {change.changeReason && (
                        <IonText color="medium" style={{ fontSize: '12px', fontStyle: 'italic' }}>
                          Reason: {change.changeReason}
                        </IonText>
                      )}
                      <div style={{ marginTop: '8px' }}>
                        <IonText color="medium" style={{ fontSize: '11px' }}>
                          Changed by: {change.changedByEmail}
                        </IonText>
                      </div>
                    </div>
                  </IonCardContent>
                </IonCard>
              ))}
            </IonList>
          </IonContent>
        </IonModal>
      </div>

      {/* Toast Notifications */}
      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={4000}
        color={toastColor}
        position="top"
      />

      {/* Confirmation Toast */}
      <ConfirmToast
        isOpen={isConfirmOpen}
        onDidDismiss={dismissConfirm}
        onConfirm={confirmAction}
        onCancel={cancelAction}
        message={confirmOptions.message}
        header={confirmOptions.header}
        confirmText={confirmOptions.confirmText}
        cancelText={confirmOptions.cancelText}
      />
    </IonContent>
  );
};

export default GlobalSettings;