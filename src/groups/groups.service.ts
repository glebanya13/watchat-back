import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Group } from '../entities/group.entity';
import { GroupMember } from '../entities/group-member.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group)
    private groupRepository: Repository<Group>,
    @InjectRepository(GroupMember)
    private groupMemberRepository: Repository<GroupMember>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async createGroup(
    senderId: string,
    name: string,
    groupPic: string = '',
    memberUids: string[],
  ): Promise<Group> {
    // Remove duplicates and ensure sender is included
    const uniqueMemberUids = [...new Set([...memberUids, senderId])];

    // Verify all users exist and filter out admins and blocked users
    const users = await this.userRepository.find({
      where: { uid: In(uniqueMemberUids) },
    });

    // Filter out admins and blocked users
    const validUsers = users.filter(u => !u.isAdmin && !u.isBlocked);
    const validUids = validUsers.map((u) => u.uid);
    const missingUids = uniqueMemberUids.filter((uid) => !validUids.includes(uid));

    if (missingUids.length > 0) {
      throw new NotFoundException(
        `Users not found or invalid: ${missingUids.join(', ')}`,
      );
    }

    // Use only valid user IDs
    const finalMemberUids = validUids;

    const group = this.groupRepository.create({
      senderId,
      name,
      groupPic,
      lastMessage: '',
    });

    const savedGroup = await this.groupRepository.save(group);

    // Add all members (including sender, but no duplicates, excluding admins and blocked)
    const members = finalMemberUids.map((uid) =>
      this.groupMemberRepository.create({
        groupId: savedGroup.groupId,
        userId: uid,
      }),
    );

    if (members.length > 0) {
      await this.groupMemberRepository.save(members);
    }

    // Return group with members loaded
    return this.getGroupById(savedGroup.groupId);
  }

  async getGroupById(groupId: string): Promise<Group> {
    const group = await this.groupRepository.findOne({
      where: { groupId },
      relations: ['members', 'members.user'],
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    return group;
  }

  async getUserGroups(userId: string): Promise<Group[]> {
    const groupMembers = await this.groupMemberRepository.find({
      where: { userId },
      relations: ['group'],
    });

    return groupMembers.map((gm) => gm.group);
  }

  async updateGroup(
    groupId: string,
    updateData: Partial<Pick<Group, 'name' | 'groupPic' | 'lastMessage'>>,
  ): Promise<Group> {
    const group = await this.groupRepository.findOne({
      where: { groupId },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    Object.assign(group, updateData);
    return this.groupRepository.save(group);
  }

  async addMembersToGroup(groupId: string, memberUids: string[]): Promise<void> {
    const existingMembers = await this.groupMemberRepository.find({
      where: { groupId },
    });

    const existingUids = existingMembers.map((m) => m.userId);
    
    // Verify users exist and filter out admins and blocked users
    const users = await this.userRepository.find({
      where: { uid: In(memberUids) },
    });
    
    const validUsers = users.filter(u => !u.isAdmin && !u.isBlocked);
    const validUids = validUsers.map(u => u.uid);
    
    const newUids = validUids.filter((uid) => !existingUids.includes(uid));

    const newMembers = newUids.map((uid) =>
      this.groupMemberRepository.create({
        groupId,
        userId: uid,
      }),
    );

    if (newMembers.length > 0) {
      await this.groupMemberRepository.save(newMembers);
    }
  }

  async removeMemberFromGroup(groupId: string, userId: string): Promise<void> {
    await this.groupMemberRepository.delete({ groupId, userId });
  }
}

