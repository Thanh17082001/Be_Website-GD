import { BaseWithCreatedBy } from 'src/common/entities/base-user-createdBy';
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity() // Đảm bảo có decorator @Entity
export class Post extends BaseWithCreatedBy{

  @Column()
  name: string;

  @Column()
  title: string;

  @Column()
  content: string;

  @Column()
  image: string;

  @Column()
  description: string;
}
