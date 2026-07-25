import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { categorizeText } from '../data/categorize';
import { useTasks } from '../state/TasksContext';
import { colors } from '../theme/tokens';
import type { Task } from '../types/models';

interface QuickAddSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function QuickAddSheet({ visible, onClose }: QuickAddSheetProps) {
  const { addTask } = useTasks();
  const [text, setText] = useState('');
  const [parsing, setParsing] = useState(false);

  function handleClose() {
    if (parsing) return;
    setText('');
    onClose();
  }

  function submit() {
    const trimmed = text.trim();
    if (!trimmed) return;
    setParsing(true);
    setTimeout(() => {
      const module = categorizeText(trimmed);
      const task: Task = {
        id: `qa-${Date.now()}`,
        title: trimmed,
        module,
        dueLabel: 'Today',
        dueBucket: 'today',
        priority: 'medium',
        completed: false,
        source: 'manual',
        notes: '',
        needsReview: false,
      };
      addTask(task);
      setParsing(false);
      setText('');
      onClose();
    }, 1100);
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.sheetWrap}
        >
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.title}>Quick Add</Text>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="e.g. Renew car insurance next month"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              autoFocus
            />
            <View style={styles.actions}>
              <Pressable
                onPress={handleClose}
                style={[styles.button, styles.cancelButton]}
              >
                <Text style={styles.cancelButtonLabel}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={submit}
                disabled={parsing}
                style={[styles.button, styles.submitButton]}
              >
                <Text style={styles.submitButtonLabel}>
                  {parsing ? 'Parsing…' : 'Add Task'}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'flex-end',
  },
  sheetWrap: {
    width: '100%',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: colors.textPrimary,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingBottom: 8,
  },
  button: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.divider,
  },
  cancelButtonLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: colors.accent,
  },
  submitButtonLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
