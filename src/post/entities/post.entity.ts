import { BaseWithCreatedBy } from 'src/common/entities/base-user-createdBy';
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity() // Đảm bảo có decorator @Entity
export class Post extends BaseWithCreatedBy{
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  content: string;
}
