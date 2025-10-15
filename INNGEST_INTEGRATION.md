# Inngest Integration for Handyman Management App

## Overview

This document describes the comprehensive Inngest integration implemented for the Handyman Management App. Inngest provides reliable background job
processing, workflow orchestration, and event-driven automation.

## What is Inngest?

Inngest is a **background job platform** that handles:

-   ✅ **Reliable email sending** (retries, failures)
-   ✅ **Scheduled tasks** (email reminders, cleanup)
-   ✅ **Event-driven workflows** (user registered → send welcome email)
-   ✅ **Queue management** (no more blocking API calls)
-   ✅ **Workflow orchestration** (multi-step processes with delays)
-   ✅ **Monitoring & debugging** (step-by-step execution logs)

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Auth Service  │───▶│   Inngest       │───▶│  Email Service  │
│                 │    │   Functions      │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Events   │    │   Workflows     │    │   Notifications  │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Implemented Workflows

### 1. **Email Workflows** (`src/inngest/emailFunctions.ts`)

#### **Email Verification**

-   **Trigger**: `auth/email.verification.requested`
-   **Function**: `sendVerificationEmailJob`
-   **Purpose**: Send email verification after user registration
-   **Retries**: 3 attempts

#### **Welcome Email**

-   **Trigger**: `auth/user.registered`
-   **Function**: `sendWelcomeEmailJob`
-   **Purpose**: Send welcome email after successful registration
-   **Retries**: 2 attempts

#### **Password Reset**

-   **Trigger**: `auth/password.reset.requested`
-   **Function**: `sendPasswordResetJob`
-   **Purpose**: Send password reset email
-   **Retries**: 3 attempts

#### **2FA Enabled**

-   **Trigger**: `auth/2fa.enabled`
-   **Function**: `send2FAEnabledJob`
-   **Purpose**: Send 2FA enabled confirmation
-   **Retries**: 2 attempts

#### **Account Locked**

-   **Trigger**: `auth/account.locked`
-   **Function**: `sendAccountLockedJob`
-   **Purpose**: Send account locked notification
-   **Retries**: 2 attempts

### 2. **Authentication Workflows** (`src/inngest/authWorkflows.ts`)

#### **User Onboarding Flow**

-   **Trigger**: `user/onboarding.started`
-   **Function**: `userOnboardingFlow`
-   **Steps**:
    1. Send welcome email immediately
    2. Wait 24 hours, check profile completion
    3. Send profile completion reminder if incomplete
    4. Wait 3 days, send role-specific tips
-   **Purpose**: Complete user onboarding experience

#### **Token Cleanup**

-   **Trigger**: Cron `0 2 * * *` (Daily at 2 AM)
-   **Function**: `cleanupExpiredTokens`
-   **Purpose**: Clean up expired verification, password reset, and refresh tokens
-   **Cleans**: Verification tokens, password reset tokens, refresh tokens, expired sessions

#### **Account Recovery**

-   **Trigger**: Cron `0 9 * * 1` (Every Monday at 9 AM)
-   **Function**: `accountRecoveryFlow`
-   **Purpose**: Find inactive users and send re-engagement emails
-   **Criteria**: Users inactive for 30+ days

#### **Security Monitoring**

-   **Trigger**: Cron `0 */6 * * *` (Every 6 hours)
-   **Function**: `securityMonitoringFlow`
-   **Purpose**: Detect suspicious login patterns and lock accounts
-   **Actions**: Lock accounts with 10+ failed attempts, send notifications

### 3. **Handyman Workflows** (`src/inngest/handymanWorkflows.ts`)

#### **Job Matching Flow**

-   **Trigger**: `customer/job.posted`
-   **Function**: `jobMatchingFlow`
-   **Steps**:
    1. Find nearby handymen with matching skills
    2. Send job notifications to each handyman
    3. Wait 2 hours, check for responses
    4. Send follow-up if no responses
-   **Purpose**: Automatically match jobs with available handymen

#### **Job Completion Flow**

-   **Trigger**: `handyman/job.completed`
-   **Function**: `jobCompletionFlow`
-   **Steps**:
    1. Update handyman rating and stats
    2. Wait 24 hours, request customer review
    3. Wait 3 days, send review reminder if needed
    4. Update handyman availability
-   **Purpose**: Handle post-job processes and feedback

#### **Availability Management**

-   **Trigger**: `handyman/availability.changed`
-   **Function**: `handymanAvailabilityFlow`
-   **Purpose**: Update handyman availability and check for pending jobs

#### **Performance Monitoring**

-   **Trigger**: Cron `0 0 * * 1` (Weekly on Monday)
-   **Function**: `handymanPerformanceFlow`
-   **Purpose**: Monitor handyman performance and send improvement tips
-   **Actions**: Send tips to low performers, recognition to top performers

### 4. **System Maintenance** (`src/inngest/maintenanceWorkflows.ts`)

#### **Daily Analytics**

-   **Trigger**: Cron `0 1 * * *` (Daily at 1 AM)
-   **Function**: `dailyAnalyticsFlow`
-   **Purpose**: Generate daily reports and send to admins
-   **Metrics**: New users, active users, completed jobs, revenue, user stats

#### **Weekly Maintenance**

-   **Trigger**: Cron `0 3 * * 0` (Weekly on Sunday at 3 AM)
-   **Function**: `weeklyMaintenanceFlow`
-   **Purpose**: System cleanup and optimization
-   **Tasks**: Clean expired sessions, archive inactive users, optimize database

#### **Monthly Analytics**

-   **Trigger**: Cron `0 2 1 * *` (First day of month at 2 AM)
-   **Function**: `monthlyAnalyticsFlow`
-   **Purpose**: Generate monthly insights and growth metrics
-   **Analysis**: User growth, engagement rates, recommendations

#### **System Health Monitoring**

-   **Trigger**: Cron `*/15 * * * *` (Every 15 minutes)
-   **Function**: `systemHealthFlow`
-   **Purpose**: Monitor system health and alert on issues
-   **Checks**: Database connectivity, Redis status, external services

## Event Types

All events are defined in `src/config/inngest.ts` with TypeScript types:

```typescript
// Authentication Events
'auth/user.registered';
'auth/email.verification.requested';
'auth/password.reset.requested';
'auth/2fa.enabled';
'auth/account.locked';

// User Events
'user/onboarding.started';
'user/profile.incomplete';

// Handyman Events
'handyman/job.matched';
'handyman/job.completed';
'handyman/availability.changed';

// Customer Events
'customer/job.posted';
'customer/job.completed';

// System Events
'system/cleanup.expired.tokens';
'system/analytics.daily';
'system/maintenance.weekly';
```

## Integration Points

### **Auth Service Integration**

The auth service (`src/services/authServices.ts`) now sends events to Inngest instead of directly calling email functions:

```typescript
// Before (blocking)
await sendVerificationEmail(user.email, verificationToken);

// After (non-blocking)
await inngest.send({
	name: 'auth/email.verification.requested',
	data: {
		userId: user._id.toString(),
		email: user.email,
		token: verificationToken,
		firstName: user.profile?.firstName || 'User'
	}
});
```

### **Benefits of Integration**

✅ **Non-blocking**: Auth endpoints return immediately  
✅ **Reliable**: Automatic retries on email failures  
✅ **Scalable**: Handle high email volumes  
✅ **Monitorable**: See job status in Inngest dashboard  
✅ **Debuggable**: Step-by-step execution logs  
✅ **Maintainable**: Centralized workflow logic

## Setup Instructions

### 1. **Install Dependencies**

```bash
npm install inngest
```

### 2. **Environment Variables**

Add to your `.env` file:

```env
# Inngest Configuration
INNGEST_EVENT_KEY=your_event_key_here
INNGEST_SIGNING_KEY=your_signing_key_here
INNGEST_APP_ID=handyman-app
```

### 3. **Get Inngest Credentials**

1. Sign up at [Inngest](https://inngest.com)
2. Create a new app: "Handyman App"
3. Get your Event Key and Signing Key
4. Add them to your `.env` file

### 4. **Start Your Server**

```bash
npm run dev
```

The Inngest webhook will be available at: `http://localhost:3006/api/inngest`

## Testing Workflows

### **Manual Testing**

You can trigger workflows manually by sending events:

```bash
curl -X POST http://localhost:3006/api/inngest \
  -H "Content-Type: application/json" \
  -d '{
    "name": "auth/user.registered",
    "data": {
      "userId": "user123",
      "email": "test@example.com",
      "firstName": "Test",
      "lastName": "User",
      "role": "customer"
    }
  }'
```

### **Testing with Postman**

1. Import the Handyman App collection
2. Register a new user
3. Check Inngest dashboard for workflow execution
4. Verify emails are sent

## Monitoring & Debugging

### **Inngest Dashboard**

-   View all workflow executions
-   See step-by-step logs
-   Monitor retry attempts
-   Debug failed jobs

### **Logs**

Each workflow logs its progress:

```typescript
console.log('Daily Report Generated:', JSON.stringify(reportData, null, 2));
```

### **Error Handling**

All workflows include proper error handling and retry logic.

## Production Considerations

### **Scaling**

-   Inngest handles horizontal scaling automatically
-   No need to manage worker processes
-   Built-in queue management

### **Reliability**

-   Automatic retries with exponential backoff
-   Dead letter queues for failed jobs
-   Circuit breakers for external services

### **Monitoring**

-   Built-in metrics and alerting
-   Integration with monitoring tools
-   Performance insights

## Future Enhancements

### **Additional Workflows**

-   Payment processing workflows
-   Notification workflows (SMS, push)
-   Integration workflows (third-party APIs)
-   Data synchronization workflows

### **Advanced Features**

-   Conditional workflows
-   Parallel execution
-   Workflow dependencies
-   Custom retry strategies

## Troubleshooting

### **Common Issues**

1. **Workflows not triggering**

    - Check Inngest credentials in `.env`
    - Verify webhook endpoint is accessible
    - Check server logs for errors

2. **Emails not sending**

    - Verify Resend API key
    - Check email templates
    - Review Inngest dashboard for failures

3. **Performance issues**
    - Monitor Inngest dashboard
    - Check database performance
    - Review workflow complexity

### **Debug Steps**

1. Check Inngest dashboard for failed jobs
2. Review server logs for errors
3. Verify environment variables
4. Test individual workflow steps

## Conclusion

The Inngest integration provides a robust foundation for background job processing in your Handyman Management App. It ensures reliable email
delivery, automated workflows, and scalable background processing while maintaining excellent developer experience and monitoring capabilities.

The system is now ready for production use with proper monitoring, error handling, and scalability built-in.
