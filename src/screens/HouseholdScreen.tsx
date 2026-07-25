import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { roleMeta, roleOrder } from '../data/roles';
import type { Role } from '../data/roles';
import { useHousehold } from '../state/HouseholdContext';
import { colors, radii, spacing } from '../theme/tokens';

const palette = ['#B5651D', '#3B5B7D', '#4F7D5D', '#7A5C8E'];

type Props = {
  navigation: { goBack: () => void };
};

export function HouseholdScreen({ navigation }: Props) {
  const { members, pendingInvites, sendInvite, resendInvite, cancelInvite, setMemberRole } =
    useHousehold();

  const [composerOpen, setComposerOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('viewer');
  const [roleMenuOpenId, setRoleMenuOpenId] = useState<string | null>(null);

  const memberCountLabel = `${members.length} member${members.length > 1 ? 's' : ''}`;

  function openComposer() {
    setEmail('');
    setRole('viewer');
    setComposerOpen(true);
  }

  function submitInvite() {
    const ok = sendInvite(email, role);
    if (ok) setComposerOpen(false);
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Pressable onPress={() => navigation.goBack()}>
        <Text style={styles.back}>‹ Back</Text>
      </Pressable>
      <Text style={styles.title}>Household</Text>
      <Text style={styles.subtitle}>
        {memberCountLabel} · everyone shares tasks, reminders and the meal plan
      </Text>

      <Pressable onPress={openComposer} style={styles.inviteButton}>
        <Text style={styles.inviteButtonLabel}>+ Invite Someone</Text>
      </Pressable>

      {composerOpen && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Invite by email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="name@example.com"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
          />
          <Text style={styles.privilegeLabel}>Privilege</Text>
          <View style={styles.pillRow}>
            {roleOrder.map((key) => {
              const active = role === key;
              const rm = roleMeta(key);
              return (
                <Pressable
                  key={key}
                  onPress={() => setRole(key)}
                  style={[styles.pill, { backgroundColor: active ? rm.color : colors.divider }]}
                >
                  <Text style={[styles.pillLabel, { color: active ? '#fff' : colors.textSecondary }]}>
                    {rm.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.composerActions}>
            <Pressable
              onPress={() => setComposerOpen(false)}
              style={[styles.actionButton, styles.cancelButton]}
            >
              <Text style={styles.cancelButtonLabel}>Cancel</Text>
            </Pressable>
            <Pressable onPress={submitInvite} style={[styles.actionButton, styles.sendButton]}>
              <Text style={styles.sendButtonLabel}>Send Invite</Text>
            </Pressable>
          </View>
        </View>
      )}

      {pendingInvites.length > 0 && (
        <>
          <Text style={styles.sectionLabel}>Pending</Text>
          <View style={styles.listCard}>
            {pendingInvites.map((inv) => {
              const rm = roleMeta(inv.role);
              const statusLabel =
                inv.status === 'sending' ? 'Sending invite…' : 'Invite sent · awaiting response';
              return (
                <View key={inv.id} style={styles.row}>
                  <View style={styles.rowHeader}>
                    <Text numberOfLines={1} style={styles.rowEmail}>
                      {inv.email}
                    </Text>
                    <View style={styles.badgeGroup}>
                      <View style={[styles.badge, { backgroundColor: rm.bg }]}>
                        <Text style={[styles.badgeLabel, { color: rm.color }]}>
                          {rm.label}
                        </Text>
                      </View>
                      <View style={[styles.badge, { backgroundColor: colors.reviewBg }]}>
                        <Text style={[styles.badgeLabel, { color: colors.reviewText }]}>Pending</Text>
                      </View>
                    </View>
                  </View>
                  <Text style={styles.rowStatus}>{statusLabel}</Text>
                  <View style={styles.rowActions}>
                    <Pressable onPress={() => resendInvite(inv.id)} style={styles.smallButton}>
                      <Text style={styles.resendButtonLabel}>Resend</Text>
                    </Pressable>
                    <Pressable onPress={() => cancelInvite(inv.id)} style={styles.smallButton}>
                      <Text style={styles.cancelSmallButtonLabel}>Cancel</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        </>
      )}

      <Text style={styles.sectionLabel}>Members</Text>
      <View style={styles.listCard}>
        {members.map((mem, i) => {
          const rm = roleMeta(mem.role);
          const menuOpen = roleMenuOpenId === mem.id;
          return (
            <View key={mem.id} style={styles.row}>
              <View style={styles.memberHeader}>
                <View style={[styles.avatar, { backgroundColor: palette[i % palette.length] }]}>
                  <Text style={styles.avatarLabel}>{mem.name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.memberBody}>
                  <Text style={styles.memberName}>{mem.name}</Text>
                  <Text numberOfLines={1} style={styles.memberEmail}>
                    {mem.email}
                  </Text>
                </View>
                <Pressable
                  onPress={() => setRoleMenuOpenId((cur) => (cur === mem.id ? null : mem.id))}
                  style={[styles.roleBadge, { backgroundColor: rm.bg }]}
                >
                  <Text style={[styles.roleBadgeLabel, { color: rm.color }]}>
                    {rm.label}
                  </Text>
                </Pressable>
              </View>
              {menuOpen && (
                <View style={styles.roleMenu}>
                  {roleOrder.map((key) => {
                    const active = mem.role === key;
                    const km = roleMeta(key);
                    return (
                      <Pressable
                        key={key}
                        onPress={() => {
                          setMemberRole(mem.id, key);
                          setRoleMenuOpenId(null);
                        }}
                        style={[styles.pill, { backgroundColor: active ? km.color : colors.divider }]}
                      >
                        <Text
                          style={[
                            styles.pillLabel,
                            { color: active ? '#fff' : colors.textSecondary },
                          ]}
                        >
                          {km.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.screenBg,
  },
  content: {
    paddingHorizontal: spacing.screenH,
    paddingTop: 8,
    paddingBottom: 40,
  },
  back: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: '600',
    paddingVertical: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 4,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  inviteButton: {
    marginTop: 16,
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
  },
  inviteButtonLabel: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  card: {
    marginTop: 14,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: 16,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  input: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: colors.textPrimary,
  },
  privilegeLabel: {
    marginTop: 12,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    color: colors.textMuted,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  pill: {
    flex: 1,
    borderRadius: radii.pill,
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  pillLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  composerActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.divider,
  },
  cancelButtonLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  sendButton: {
    backgroundColor: colors.accent,
  },
  sendButtonLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  sectionLabel: {
    marginTop: 22,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  listCard: {
    marginTop: 10,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    overflow: 'hidden',
  },
  row: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  rowEmail: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    flexShrink: 1,
  },
  badgeGroup: {
    flexDirection: 'row',
    gap: 6,
    flexShrink: 0,
  },
  badge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: radii.pill,
  },
  badgeLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  rowStatus: {
    fontSize: 12.5,
    color: colors.textMuted,
    marginTop: 4,
  },
  rowActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  smallButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: colors.divider,
  },
  resendButtonLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  cancelSmallButtonLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.priority.high,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  memberBody: {
    flex: 1,
    minWidth: 0,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  memberEmail: {
    fontSize: 12.5,
    color: colors.textMuted,
    marginTop: 1,
  },
  roleBadge: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: radii.pill,
  },
  roleBadgeLabel: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  roleMenu: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    paddingLeft: 46,
  },
});
